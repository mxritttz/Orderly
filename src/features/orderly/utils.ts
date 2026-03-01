export const formatTime = (date: Date | string | number) =>
  new Date(date).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

export const timeAgo = (date: Date | string | number) => {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min`;
  return `vor ${Math.floor(mins / 60)} Std`;
};
