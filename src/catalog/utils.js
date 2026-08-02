export const toggleRequiredMulti = (currentValues, value) => (
  currentValues.includes(value)
    ? (currentValues.length > 1 ? currentValues.filter(x => x !== value) : currentValues)
    : [...currentValues, value]
);
