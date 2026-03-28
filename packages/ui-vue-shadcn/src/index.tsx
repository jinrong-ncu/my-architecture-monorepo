import { defineComponent } from 'vue';

export const Button = defineComponent({
  name: 'Button',
  setup(props, { slots }) {
    return () => {
      return (
        <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          {slots.default && slots.default()}
        </button>
      )
    }
  }
});

