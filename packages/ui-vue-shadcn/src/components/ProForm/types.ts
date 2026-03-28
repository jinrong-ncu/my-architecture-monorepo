export interface FormItemConfig {
  name: string;
  label: string;
  span?: number;
  component: 'input' | 'textarea' | 'select' | 'radio' | 'checkboxGroup' | 'checkbox' | 'date' | 'number' | 'switch' | 'divider' | 'upload' | string;
  options?: any;
  rules?: any[];
  hideHandle?: string | boolean;
  requiredHandle?: string;
  message?: string;
  tips?: string;
}

export interface ProFormConfig {
  title?: string;
  labelPosition?: 'horizontal' | 'vertical'; // Horizontal is harder in tailwind form grids without strict column ratios, but we'll try to support space-y/flex depending on this
  autoLabelWidth?: boolean;
}

export interface ProFormProps {
  items: FormItemConfig[];
  modelValue?: Record<string, any>;
  config?: ProFormConfig;
  readonly?: boolean;
}
