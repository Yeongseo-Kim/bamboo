/**
 * 랜덤 닉네임 생성 (형용사 + 동물)
 * 서버에서 사용하는 것을 우선하며, 클라이언트에서는 폴백용
 */

const ADJECTIVES = [
  '졸린',
  '용감한',
  '부지런한',
  '차분한',
  '즐거운',
  '평화로운',
  '따뜻한',
  '상냥한',
  '호기심많은',
  '재치있는',
];

const ANIMALS = [
  '나무늘보',
  '사자',
  '펭귄',
  '토끼',
  '고양이',
  '강아지',
  '햄스터',
  '다람쥐',
  '코알라',
  '판다',
];

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj} ${animal}`;
}
