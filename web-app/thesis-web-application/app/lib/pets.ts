export const SPECIES = ["Dog", "Cat", "Bird", "Poultry", "Reptile", "Fish", "Rabbit", "Other"];

export function formatAge(birthDate: Date, approximate: boolean) {
  const now = new Date();
  let months =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());
  if (now.getDate() < birthDate.getDate()) months -= 1;
  months = Math.max(months, 0);

  const years = Math.floor(months / 12);
  const rest = months % 12;
  let text: string;
  if (years === 0) text = `${rest} month${rest === 1 ? "" : "s"}`;
  else if (rest === 0) text = `${years} year${years === 1 ? "" : "s"}`;
  else text = `${years}y ${rest}m`;
  return approximate ? `~${text}` : text;
}
