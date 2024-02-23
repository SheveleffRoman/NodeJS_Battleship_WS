export function generateRandomId(): number {
  const min = 100000; // Минимальное значение для генерации
  const max = 999999; // Максимальное значение для генерации

  // Генерация случайного числа в заданном диапазоне
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  return Number(randomNumber);
}