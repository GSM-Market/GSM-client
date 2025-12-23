/**
 * 욕설 필터 유틸리티 (프론트엔드)
 * 채팅 메시지에서 욕설/비속어를 탐지하고 차단합니다.
 */

// 욕설 단어 리스트 (백엔드와 동일)
const PROFANITY_WORDS = [
  '시발', '씨발', '병신', '병딱', '빙신', '빙딱',
  '개새끼', '개새', '개쓰레기', '개같은', '개돼지',
  '좆', '좃', '존나', '존니', '존나게',
  '미친', '미친놈', '미친년', '미친새끼',
  '닥쳐', '닥치', '닥쳐라',
  '죽어', '죽어라', '죽을', '죽여',
  '엿', '엿먹어', '엿먹어라',
  '지랄', '지랄하네', '지랄한다',
  '개소리', '헛소리',
  '바보', '멍청이', '등신', '호구',
  '새끼', '새키', '새퀴',
  '놈', '년', '새끼',
  '쓰레기', '찌질이',
  'ㅅㅂ', 'ㅂㅅ', 'ㅅㅣㅂㅏㄹ', 'ㅂㅣㅇㅅㅣㄴ',
  'ㄱㅐㅅㅐㄲㅣ', 'ㅈㅗㄴㄴㅏ',
  'sibal', 'sibbal', 'ssibal', 'sibarl',
  'byungsin', 'byungshin',
  'gae', 'gae saekki', 'gaesaekki',
  'jot', 'jotna', 'jonna',
  'michin', 'michin nom',
  'dakchyeo', 'dakchi',
  'juk', 'juk eo', 'juk eora',
  'yeot', 'yeot meogeo',
  'jiral', 'jiralhane',
  'gaesori', 'heutsori',
  'saekki', 'saeki', 'saekwi',
  'nom', 'nyeon',
  'sseuregi', 'jjijiri',
  '시이발', '시발발', '병신신', '개새끼끼',
];

/**
 * 텍스트 정규화 함수
 */
export const normalizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  let normalized = text.toLowerCase();
  
  // 공백 제거
  normalized = normalized.replace(/\s+/g, '');
  
  // 특수문자 제거
  normalized = normalized.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g, '');
  
  // 반복 문자 축약
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1');
  
  return normalized;
};

/**
 * 욕설 포함 여부 확인
 */
export const containsProfanity = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const normalized = normalizeText(text);
  
  // 욕설 단어 리스트와 비교
  for (const word of PROFANITY_WORDS) {
    const normalizedWord = normalizeText(word);
    if (normalized.includes(normalizedWord)) {
      return true;
    }
  }
  
  // 공백/특수문자로 분리된 형태 검사
  const textWithoutSpecial = text.replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`\s]/g, '');
  const normalizedWithoutSpecial = normalizeText(textWithoutSpecial);
  
  for (const word of PROFANITY_WORDS) {
    const normalizedWord = normalizeText(word);
    if (normalizedWithoutSpecial.includes(normalizedWord)) {
      return true;
    }
  }
  
  return false;
};

/**
 * 메시지 검증
 */
export const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: '메시지가 없습니다.' };
  }
  
  if (message.trim().length === 0) {
    return { valid: false, error: '메시지를 입력해주세요.' };
  }
  
  if (containsProfanity(message)) {
    return { 
      valid: false, 
      error: '부적절한 표현이 포함되어 전송할 수 없습니다.' 
    };
  }
  
  return { valid: true };
};

export default {
  normalizeText,
  containsProfanity,
  validateMessage
};

