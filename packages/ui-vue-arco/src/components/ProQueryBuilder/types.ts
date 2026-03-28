export type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'DICT';

export interface FieldOption {
  value: string;
  label: string;
  type?: FieldType;
  children?: FieldOption[];
}

export interface RuleItem {
  id: string;
  type: 'item';
  field: string[];
  operator: string;
  value: any;
  fieldType: FieldType;
}

export interface RuleGroup {
  id: string;
  type: 'group';
  relation: 'AND' | 'OR';
  children: Array<RuleGroup | RuleItem>;
}

export const operatorMap: Record<FieldType, Array<{ value: string; label: string }>> = {
  TEXT: [
    { value: 'eq', label: '等于' },
    { value: 'like', label: '包含' },
    { value: 'empty', label: '为空' },
  ],
  NUMBER: [
    { value: 'eq', label: '等于' },
    { value: 'gt', label: '大于' },
    { value: 'lt', label: '小于' },
    { value: 'between', label: '介于' },
    { value: 'empty', label: '为空' },
  ],
  DATE: [
    { value: 'eq', label: '等于' },
    { value: 'between', label: '区间' },
    { value: 'af', label: '相对时间后' },
    { value: 'bf', label: '相对时间前' },
    { value: 'empty', label: '为空' },
  ],
  DICT: [
    { value: 'eq', label: '等于' },
    { value: 'in', label: '属于' },
    { value: 'empty', label: '为空' },
  ]
};
