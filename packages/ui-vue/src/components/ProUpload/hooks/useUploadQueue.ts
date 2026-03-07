/**
 * useUploadQueue — 并发上传队列调度引擎
 *
 * 设计思路：
 * 维护一个"虚拟令牌池"（activeCount），当 activeCount < maxConcurrent 时，
 * 直接消费队列头部任务；否则将任务挂在 pending 数组中等待令牌释放。
 * 每当任务完成（resolve 或 reject），就释放一个令牌并驱动下一个任务。
 */
export function useUploadQueue(maxConcurrent: number = 3) {
    // 当前正在执行的任务数
    let activeCount = 0;

    // 等待执行的任务挂起列表（FIFO 队列）
    const pendingQueue: Array<() => void> = [];

    /**
     * 添加任务到并发队列
     * @param taskFn 返回 Promise 的任务函数（内部自行实现实际上传逻辑）
     * @returns 与任务结果同步的 Promise，caller 可 await 或 catch
     */
    function addTask<T>(taskFn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            // 用一个 runner 闭包包裹任务执行与令牌释放逻辑
            const runner = async () => {
                activeCount++;
                try {
                    const result = await taskFn();
                    resolve(result);
                } catch (err) {
                    reject(err);
                } finally {
                    // 无论成功失败，任务结束后释放令牌并消费下一个挂起任务
                    activeCount--;
                    dequeue();
                }
            };

            // 判断令牌是否充足
            if (activeCount < maxConcurrent) {
                runner();
            } else {
                // 令牌不足，挂起等待
                pendingQueue.push(runner);
            }
        });
    }

    /**
     * 从等待队列中取出下一个任务并执行（令牌释放后驱动）
     */
    function dequeue() {
        if (pendingQueue.length > 0) {
            const next = pendingQueue.shift()!;
            next();
        }
    }

    return { addTask };
}
