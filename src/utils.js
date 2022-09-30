export const findContextById = (contexts, id) => {
  for (let context of contexts) {
    if (context.context === id) return context;

    if (context.children) {
      let desiredContext = findContextById(context.children, id);
      if (desiredContext) return desiredContext;
    }
  }
  return false;
};
