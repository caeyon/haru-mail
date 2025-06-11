export interface DiaryInfoDto {
    diaryId: number;
    title: string;
    content: any; // Editor.js의 saved JSON 형태 (object)
    date: string;
    tags: string[];
}