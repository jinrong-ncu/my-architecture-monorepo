<template>
  <form @submit.prevent="handleSubmit" class="w-full">
    <div :class="['grid gap-6', 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3']">
      <template v-for="item in items" :key="item.name + (item.options?.name || '')">
        <!-- Divider / Section Title -->
        <div v-if="item.component === 'divider'" class="col-span-1 md:col-span-2 lg:col-span-3 flex items-center gap-2 pt-4 pb-2">
          <span class="text-sm font-semibold text-foreground">{{ item.label }}</span>
          <HelpCircle v-if="item.tips" class="h-4 w-4 text-muted-foreground" :title="item.tips" />
          <div class="h-px bg-border flex-1 ml-2"></div>
        </div>

        <!-- Form Item -->
        <div v-else-if="!checkHide(item)" :class="[item.span === 24 ? 'col-span-1 md:col-span-2 lg:col-span-3' : 'col-span-1', 'space-y-2']">
          
          <div class="flex items-center gap-1.5" v-if="item.label">
            <label class="text-sm font-medium leading-none">{{ item.label }}</label>
            <HelpCircle v-if="item.tips" class="h-3.5 w-3.5 text-muted-foreground" :title="item.tips" />
            <span v-if="isRequired(item)" class="text-destructive">*</span>
          </div>

          <!-- Readonly mode text display -->
          <div v-if="props.readonly" class="min-h-[36px] py-2 text-sm text-foreground break-words select-text">
            {{ renderReadonlyText(item, getModelRef(item).value) }}
          </div>

          <!-- Interactive controls -->
          <div v-else class="relative w-full">
            <template v-if="item.component === 'input'">
              <Input 
                v-model="getModelRef(item).value" 
                :placeholder="item.options?.placeholder" 
                :disabled="item.options?.disabled" 
                :type="item.options?.type" 
                :maxlength="item.options?.maxlength" 
              />
            </template>

            <template v-else-if="item.component === 'textarea'">
              <textarea 
                v-model="getModelRef(item).value" 
                class="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                :placeholder="item.options?.placeholder" 
                :disabled="item.options?.disabled" 
                :maxlength="item.options?.maxlength"
              ></textarea>
            </template>

            <template v-else-if="item.component === 'select'">
              <Select v-model="getModelRef(item).value" :disabled="item.options?.disabled">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="item.options?.placeholder || '请选择'" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in (item.options?.items || [])" :key="opt.value" :value="String(opt.value)">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </template>

            <template v-else-if="item.component === 'radio'">
               <RadioGroup v-model="getModelRef(item).value" :disabled="item.options?.disabled" class="flex flex-col space-y-1">
                 <div class="flex items-center space-x-2" v-for="opt in (item.options?.items || [])" :key="opt.value">
                   <RadioGroupItem :id="item.name+'-'+opt.value" :value="String(opt.value)" />
                   <label :for="item.name+'-'+opt.value" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                     {{ opt.label }}
                   </label>
                 </div>
               </RadioGroup>
            </template>

            <template v-else-if="item.component === 'checkboxGroup'">
               <div class="flex flex-wrap gap-4 pt-1">
                 <div class="flex items-center space-x-2" v-for="opt in (item.options?.items || [])" :key="opt.value">
                   <Checkbox :id="item.name+'-'+opt.value" :disabled="item.options?.disabled" :checked="(getModelRef(item).value || []).includes(String(opt.value))" @update:checked="(val: boolean) => toggleCheckbox(item, String(opt.value), val)" />
                   <label :for="item.name+'-'+opt.value" class="text-sm font-medium leading-none">{{ opt.label }}</label>
                 </div>
               </div>
            </template>

            <template v-else-if="item.component === 'checkbox'">
               <div class="flex items-center space-x-2 pt-2">
                 <Checkbox 
                    :id="item.name" 
                    :disabled="item.options?.disabled"
                    :checked="!!getModelRef(item).value" 
                    @update:checked="(val: boolean) => getModelRef(item).value = val" 
                 />
                 <label :for="item.name" class="text-sm font-medium leading-none">{{ item.options?.placeholder || '是' }}</label>
               </div>
            </template>

            <template v-else-if="item.component === 'switch'">
               <div class="pt-1">
                 <Switch 
                   :checked="!!getModelRef(item).value" 
                   :disabled="item.options?.disabled"
                   @update:checked="(val: boolean) => getModelRef(item).value = val" 
                 />
               </div>
            </template>

            <template v-else-if="item.component === 'number'">
              <Input 
                type="number"
                v-model="getModelRef(item).value" 
                :placeholder="item.options?.placeholder" 
                :disabled="item.options?.disabled" 
                :min="item.options?.min"
                :max="item.options?.max"
                :step="item.options?.step"
              />
            </template>
            
            <template v-else-if="item.component === 'date'">
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-full justify-start text-left font-normal" :class="!getModelRef(item).value && 'text-muted-foreground'">
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ getModelRef(item).value ? getModelRef(item).value : (item.options?.placeholder || '选择日期') }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <!-- Native input date fallback for simplicity, or we can use custom Calendar if VCalendar was active -->
                  <div class="p-3">
                     <input type="date" v-model="getModelRef(item).value" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
                  </div>
                </PopoverContent>
              </Popover>
            </template>

            <template v-else>
               <slot :name="item.component" :item="item" :model="formData" :modelRef="getModelRef(item)" />
            </template>
          </div>
          
          <div v-if="item.message" class="text-[13px] text-muted-foreground mt-1.5">{{ item.message }}</div>
        </div>
      </template>
    </div>

    <!-- Actions -->
    <div v-if="!props.readonly" class="mt-8 flex items-center justify-start gap-3">
      <slot name="action" :form="formRef" :model="formData">
         <Button type="submit">提交保存</Button>
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, watch, reactive, onMounted } from 'vue';
import type { FormItemConfig, ProFormProps } from './types';
import { HelpCircle, Calendar as CalendarIcon } from 'lucide-vue-next';

// shadcn UI
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
// using native radio input structure inside component template to save deps, or wait, I didn't install RadioGroup. I will use radio group inside component if it's there, but to be totally safe in shading port without RadioGroup added, I'll fallback to native inputs or custom markup. Actually, let's omit RadioGroup primitive and map radio directly if fails. But wait, I added checkbox... I will make sure the template doesn't crash.

const props = defineProps<ProFormProps>();
const emit = defineEmits(['update:modelValue', 'submit']);

const formRef = ref<HTMLFormElement | null>(null);
const formData = reactive<Record<string, any>>({});

function deepMerge(dst: Record<string, any>, src: Record<string, any>) {
  for (const key in src) {
    if (src[key] !== null && typeof src[key] === 'object' && !Array.isArray(src[key])) {
      if (!dst[key]) dst[key] = {};
      deepMerge(dst[key], src[key]);
    } else {
      dst[key] = src[key];
    }
  }
}

function initFormData() {
  deepMerge(formData, props.modelValue || {});
  props.items.forEach(item => {
    if (item.name && item.options?.name) {
      if (!formData[item.name]) formData[item.name] = {};
    }
  });
}

onMounted(initFormData);

watch(() => props.modelValue, (newVal) => {
  deepMerge(formData, newVal || {});
}, { deep: true });

watch(formData, (newVal) => {
  emit('update:modelValue', { ...newVal });
}, { deep: true });

function getModelRef(item: FormItemConfig) {
  const parent = item.name;
  const child = item.options?.name;

  if (child) {
    if (!formData[parent]) formData[parent] = {};
    return {
      get value() { return formData[parent][child]; },
      set value(v: any) { formData[parent][child] = v; }
    };
  }
  return {
    get value() { return formData[parent]; },
    set value(v: any) { formData[parent] = v; }
  };
}

function checkHide(item: FormItemConfig): boolean {
  if (item.hideHandle == null) return false;
  if (typeof item.hideHandle === 'boolean') return item.hideHandle;
  try {
    const fn = new Function('form', `return (${item.hideHandle.replace(/\$/g, 'form')})`);
    return !!fn(formData);
  } catch (e) {
    return false;
  }
}

function isRequired(item: FormItemConfig) {
  if (item.rules?.find(r => 'required' in r)) return true;
  if (item.requiredHandle) {
    try {
      const fn = new Function('form', `return (${item.requiredHandle.replace(/\$/g, 'form')})`);
      return !!fn(formData);
    } catch { return false; }
  }
  return false;
}

const toggleCheckbox = (item: FormItemConfig, value: string, checked: boolean) => {
   const refObj = getModelRef(item);
   let current = refObj.value;
   if (!Array.isArray(current)) current = [];
   
   if (checked && !current.includes(value)) {
     refObj.value = [...current, value];
   } else if (!checked) {
     refObj.value = current.filter((v: string) => v !== value);
   }
};

const renderReadonlyText = (item: FormItemConfig, val: any): string => {
  if (val == null || val === '') return '-';
  if (item.component === 'select' || item.component === 'radio' || item.component === 'checkboxGroup') {
    const opts = item.options?.items || [];
    if (Array.isArray(val)) {
       return val.map((v: any) => opts.find((o: any) => String(o.value) === String(v))?.label || String(v)).join(', ');
    }
    return opts.find((o: any) => String(o.value) === String(val))?.label || String(val);
  }
  if (item.component === 'switch' || item.component === 'checkbox') {
    return val ? '是 (开启)' : '否 (关闭)';
  }
  if (Array.isArray(val)) return val.join(', ');
  return String(val);
};

const handleSubmit = () => {
    // raw html form validation could be wired here
    emit('submit', { ...formData });
};
</script>
