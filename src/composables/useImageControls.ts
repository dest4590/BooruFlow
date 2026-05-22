import { ref, computed } from "vue";

export function useImageControls() {
  const scaleMode = ref<"fit" | "actual">("fit");
  const enableScrollMode = ref(false);
  const showSettings = ref(false);

  const containerClass = computed(() => {
    if (scaleMode.value === "actual") {
      return "max-h-[95vh] overflow-y-auto w-full";
    }
    return "flex items-center justify-center w-full h-[95vh]";
  });

  const imageClass = computed(() => {
    const classes = [
      "transition-opacity duration-300 rounded-lg shadow-2xl",
    ];

    if (scaleMode.value === "actual") {
      classes.push("w-full h-auto object-contain");
    } else {
      classes.push("max-w-full max-h-full object-contain");
    }

    return classes;
  });

  const reset = () => {
    scaleMode.value = "fit";
    enableScrollMode.value = false;
    showSettings.value = false;
  };

  return {
    scaleMode,
    enableScrollMode,
    showSettings,
    containerClass,
    imageClass,
    reset,
  };
}
