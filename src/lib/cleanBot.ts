/**
 * 클린 봇: 비속어 및 금융 사기 유도 키워드 필터링
 * MVP용 기본 키워드 목록 (운영 시 확장 예정)
 */

const BAD_WORDS = [
  // 비속어·욕설
  '시발',
  '개새',
  '지랄',
  // 금융 사기 유도
  '보이스피싱',
  '대출사기',
  '급전대출',
  '연대보증대출',
];

export function containsBlockedContent(text: string): boolean {
  const lower = text.trim();
  return BAD_WORDS.some((word) => lower.includes(word));
}
