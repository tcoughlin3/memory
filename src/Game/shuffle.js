export function shuffle(arr) {
  arr.forEach((card, index) => {
    const randomIndex = Math.floor(Math.random() * arr.length);
    const randomCard = arr[randomIndex];
    arr.splice(index, 1, randomCard);
    arr.splice(randomIndex, 1, card);
  });
  return arr;
}

export default shuffle;
