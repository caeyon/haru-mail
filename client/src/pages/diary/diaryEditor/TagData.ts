// 태그 타입 정의
export interface Tag {
    id: number;
    emoji: string;
    label: string;
}

// 카테고리 상태 타입 정의
export interface CategoryTags {
    '기분': Tag[];
    '생활 & 경험': Tag[];
    '취미': Tag[];
    '특별한 순간': Tag[];
    '날씨': Tag[];
    '기타': Tag[];
}

// 카테고리별 태그 데이터
export const initialCategoryTags: CategoryTags = {
    '기분': [
        { id: 1, emoji: '😊', label: '기쁨' },
        { id: 2, emoji: '😢', label: '슬픔' },
        { id: 3, emoji: '😠', label: '화남' },
        { id: 4, emoji: '😌', label: '평온' },
        { id: 5, emoji: '🤯', label: '피곤' }
    ],
    '생활 & 경험': [
        { id: 6, emoji: '🍱', label: '음식' },
        { id: 7, emoji: '✈️', label: '여행' },
        { id: 8, emoji: '📚', label: '공부' },
        { id: 9, emoji: '🏋️', label: '운동' },
        { id: 10, emoji: '🏠', label: '일상' },
        { id: 11, emoji: '💼', label: '직장/학교' }
    ],
    '취미': [
        { id: 12, emoji: '🖌️', label: '예술' },
        { id: 13, emoji: '🎼', label: '음악' },
        { id: 14, emoji: '📚', label: '독서' },
        { id: 15, emoji: '🎮', label: '게임' },
        { id: 16, emoji: '🏃‍♂️', label: '스포츠' },
        { id: 17, emoji: '🍳', label: '요리' }
    ],
    '특별한 순간': [
        { id: 18, emoji: '🎉', label: '기념일' },
        { id: 19, emoji: '🎁', label: '선물' },
        { id: 20, emoji: '🎶', label: '공연' },
        { id: 21, emoji: '🎬', label: '영화' },
        { id: 22, emoji: '📸', label: '추억' }
    ],
    '날씨': [
        { id: 23, emoji: '☀️', label: '맑음' },
        { id: 24, emoji: '🌤️', label: '구름 조금' },
        { id: 25, emoji: '⛅', label: '구름 많음' },
        { id: 26, emoji: '☁️', label: '흐림' },
        { id: 27, emoji: '🌧️', label: '비' },
        { id: 28, emoji: '⛈️', label: '천둥번개' },
        { id: 29, emoji: '🌨️', label: '눈' },
        { id: 30, emoji: '🌬️', label: '강풍' },
        { id: 31, emoji: '🌫️', label: '안개' },
        { id: 32, emoji: '🔥', label: '무더위' },
        { id: 33, emoji: '❄️', label: '한파' },
        { id: 34, emoji: '🌈', label: '무지개' },
        { id: 35, emoji: '💨', label: '황사' },
        { id: 36, emoji: '🌪️', label: '태풍' }
    ],
    '기타': []
};