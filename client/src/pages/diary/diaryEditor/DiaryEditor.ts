import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Image from '@editorjs/image';
import Marker from '@editorjs/marker';
import ColorPicker from 'editorjs-color-picker';
import Underline from '@editorjs/underline';

export let editor: EditorJS | null = null; // 에디터 인스턴스 (전역 참조용)
let isInitializing = false; // 중복 초기화를 방지하기 위한 플래그

const accessToken = localStorage.getItem("accessToken"); // 저장된 토큰 가져오기

// 에디터 초기화
export const initializeEditor = (holder: HTMLElement, onChange: () => void) => {
    if (editor || isInitializing) return; // 이미 초기화 중이거나 완료된 경우 종료

    console.log("initializing...");
    isInitializing = true;

    const instance = new EditorJS({
        holder,
        tools: {
            underline: Underline,
            header: Header,
            list: List,
            marker: Marker,
            ColorPicker: {
                class: ColorPicker
            },
            image: {
                class: Image,
                config: {
                    uploader: {
                        async uploadByFile(file: File) {
                            const formData = new FormData();
                            formData.append("file", file);

                            const res = await fetch("http://localhost:8080/api/image/upload-image", {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${accessToken}`
                                },
                                credentials: "include",
                                body: formData,
                            });

                            const result = await res.json();

                            if (result.success) {
                                return {
                                    success: 1,
                                    file: {
                                        url: result.url,
                                    },
                                };
                            } else {
                                console.error("Upload failed:", result.error);
                                return { success: 0 };
                            }
                        }
                    }
                }
            },
        },
        autofocus: true,
        onChange: () => {
            instance.save().then(() => {
                onChange();
            }).catch((error) => {
                console.error("Error saving editor content on change:", error);
            });
        }
    });

    // 에디터가 준비되면 전역 editor에 저장
    instance.isReady.then(() => {
        editor = instance;
        isInitializing = false;
        console.log("Editor initialized!");
    }).catch((error) => {
        console.error("Editor init failed", error);
        isInitializing = false;
    });
};

// 에디터 제거(메모리 해제)
export const destroyEditor = () => {
    if (editor && typeof editor.destroy === 'function') {
        editor.destroy();
        editor = null;
        console.log("Editor destroyed");
    }
};

// 오늘 날짜 포맷팅
export function getFormattedToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const day = ['일', '월', '화', '수', '목', '금', '토'][today.getDay()];
    return `${year}.${month}.${date} (${day})`;
}

// 일기 저장
export const getEditorData = async () => {
    if (editor) {
        try {
            const data = await editor.save();
            const jsonData = JSON.stringify(data); // JSON 문자열로 변환
            return jsonData;
        } catch (err) {
            console.error("저장 실패:", err);
        }
    }
};