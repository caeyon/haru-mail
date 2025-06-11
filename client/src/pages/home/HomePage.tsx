import React, { useState, useEffect, useRef, useCallback } from 'react';
import './HomePage.css';
import apiClient from '../../utils/axiosInstance'; // ⭐ axiosInstance 임포트 경로 확인!

const HomePage: React.FC = () => {
  // ⭐ 구독 모달 관련 상태
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState("daily");
  const [isAgreed, setIsAgreed] = useState(false);

  // ⭐ 로그인 모달 관련 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  // ⭐ loginEmail: 실제 백엔드로 전달될 전체 이메일 (예: user@gmail.com)
  const [loginEmail, setLoginEmail] = useState("");
  // ⭐ displayEmail: 사용자에게 입력 필드에 보여질 부분 (예: user)
  const [displayEmail, setDisplayEmail] = useState("");
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState<boolean | null>(null);


  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({});

  const contentItemRefs = useRef<Record<string, HTMLElement | null>>({});
  const [visibleContentItems, setVisibleContentItems] = useState<Record<string, boolean>>({});

  const sectionObserverCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const sectionId = entry.target.id;
      if (entry.isIntersecting) {
        setVisibleSections(prev => ({ ...prev, [sectionId]: true }));
      } else {
        setVisibleSections(prev => ({ ...prev, [sectionId]: false }));
      }
    });
  }, []);

  const contentItemObserverCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const itemId = entry.target.id;
      if (entry.isIntersecting) {
        setVisibleContentItems(prev => ({ ...prev, [itemId]: true }));
      }
    });
  }, []);

  useEffect(() => {
    const sectionObserver = new IntersectionObserver(sectionObserverCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.2
    });

    sectionRefs.current.forEach(section => {
      if (section) {
        sectionObserver.observe(section);
      }
    });

    const contentItemObserver = new IntersectionObserver(contentItemObserverCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.5
    });

    Object.values(contentItemRefs.current).forEach(item => {
      if (item) {
        contentItemObserver.observe(item);
      }
    });

    return () => {
      sectionRefs.current.forEach(section => {
        if (section) {
          sectionObserver.unobserve(section);
        }
      });
      Object.values(contentItemRefs.current).forEach(item => {
        if (item) {
          contentItemObserver.unobserve(item);
        }
      });
    };
  }, [sectionObserverCallback, contentItemObserverCallback]);

  const setContentItemRef = useCallback((el: HTMLElement | null, id: string) => {
    if (el) {
      contentItemRefs.current[id] = el;
    }
  }, []);

  // 구독하기 버튼 클릭 핸들러 (구독 모달 열기)
  const handleSubscribeClick = () => {
    setShowSubscribeModal(true);
  };

  // 구독 모달 닫기
  const handleCloseSubscribeModal = () => {
    setShowSubscribeModal(false);
  };

  // 로그인 모달 닫기
  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
    setLoginEmail("");
    setDisplayEmail(""); // ⭐ displayEmail 초기화
    setLoginErrorMessage("");
    setIsEmailVerified(null);
  };

  // 구독 모달 내 "Google Mail로 시작하기!" 버튼 클릭 핸들러
  const handleGoogleLoginForSubscribe = () => {
    if (!isAgreed) return;

    localStorage.setItem("subscription_frequency", selectedFrequency);
    localStorage.setItem("subscription_agreement", String(isAgreed));

    // 신규 구독 시 구글 로그인으로 이동. 로그인 성공 후 `/list`로 이동하도록 `redirect` 파라미터 추가.
    window.location.href = `http://localhost:8080/oauth2/authorization/google`;
  };

  // ⭐ 헤더의 "로그인" 버튼 클릭 핸들러 (로그인 모달 열기)
  const handleLoginButtonClick = () => {
    setShowLoginModal(true);
    // 모달을 다시 열 때 이전 상태 초기화
    setLoginEmail("");
    setDisplayEmail(""); // ⭐ displayEmail 초기화
    setLoginErrorMessage("");
    setIsEmailVerified(null);
  };

  // ⭐ 이메일 입력 필드 변경 핸들러
  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayEmail(inputValue); // 사용자가 입력하는 그대로 화면에 보여줌

    // @gmail.com이 포함되어 있는지 확인하거나, @가 없는 경우 @gmail.com을 붙여서 loginEmail 설정
    if (inputValue.includes("@")) {
      setLoginEmail(inputValue); // 사용자가 @를 입력했으면 그대로 사용 (유효성 검사에서 걸러짐)
    } else {
      setLoginEmail(inputValue + "@gmail.com"); // @가 없으면 뒤에 @gmail.com을 붙여 실제 이메일 값으로 설정
    }
    setLoginErrorMessage(""); // 입력 시 에러 메시지 초기화
    setIsEmailVerified(null); // 입력 시 확인 상태 초기화
  };


  // ⭐ 로그인 모달에서 이메일 확인 버튼 클릭 핸들러
  const handleCheckExistingUserEmail = async () => {
    setLoginErrorMessage(""); // 에러 메시지 초기화
    setIsEmailVerified(null); // ⭐ 확인 중임을 나타내기 위해 null로 설정

    // ⭐ 실제 검증에 사용할 이메일 값은 loginEmail 상태를 사용
    if (!loginEmail || loginEmail.replace("@gmail.com", "").trim() === "") { // @gmail.com만 있거나 비어있는 경우
      setLoginErrorMessage("이메일 주소를 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@gmail\.com$/; // ⭐ @gmail.com만 허용하는 정규식으로 변경
    if (!emailRegex.test(loginEmail)) {
        setLoginErrorMessage("유효한 Gmail 주소를 입력해주세요. (@gmail.com만 가능)");
        return;
    }

    try {
      // ⭐ 백엔드로 보낼 때도 loginEmail 사용
      const response = await apiClient.get(`/api/auth/verify?email=${encodeURIComponent(loginEmail)}`);

      if (response.status === 200 && response.data.status === 'verified') {
        setIsEmailVerified(true); // ⭐ 이메일 확인 성공 (구독자)
        setLoginErrorMessage("등록된 이메일입니다. Google 계정으로 로그인해주세요.");
      } else {
        // 백엔드에서 200 OK를 보냈지만 예상치 못한 응답인 경우 (실제로는 일어나지 않아야 함)
        setIsEmailVerified(false);
        setLoginErrorMessage("이메일 확인에 실패했습니다. 다시 시도해주세요.");
      }
    } catch (error: any) {
      console.error('이메일 확인 중 오류 발생:', error);
      if (error.response && error.response.status === 401) {
        setIsEmailVerified(false); // ⭐ 이메일 확인 실패 (비구독자)
        setLoginErrorMessage("등록되지 않은 이메일 주소입니다.");
      } else {
        setLoginErrorMessage("이메일 확인 중 오류가 발생했습니다. 네트워크를 확인해주세요.");
        setIsEmailVerified(null); // 네트워크 오류는 상태를 알 수 없으므로 null로 유지
      }
    }
  };

  // ⭐ 등록된 이메일로 구글 로그인 시작
  const handleGoogleLoginForVerifiedUser = () => {
      window.location.href = `http://localhost:8080/oauth2/authorization/google`;
  }

  // ⭐ 미등록 이메일 시 구독하기 페이지로 이동
  const handleSubscribeForNewUser = () => {
      handleCloseLoginModal(); // 로그인 모달 닫기
      handleSubscribeClick(); // 구독 모달 열기
  }


  return (
    <div className="webpage-layout">
      <header className="webpage-header">
        <div className="header-content">
          <a href="/" className="homepage-logo" style={{ textDecoration: 'none' }}>
            <h2>하루 메일</h2>
          </a>
          <div className="header-actions">
            <span className="login-text">혹시 이미 구독 중이시라면? ☞</span>
              <button className="header-login-button" onClick={handleLoginButtonClick}>
                로그인
              </button>
          </div>
        </div>
      </header>

      <div className="webpage-container">
        <main className="webpage-main">
          <div className="text-section">
            <h2 className="main-title">매일매일 새로운 질문들로 하루를 마무리 해보세요!</h2>
            <p className="main-subtitle">당신의 메일로 매일 다른 질문을 보내드릴게요.</p>
            <button className="subscribe-button" onClick={handleSubscribeClick}>
              구독하러 가기<span role="img" aria-label="hands">🙌</span>
            </button>
          </div>
          <div className="image-section">
            <img
              src="/images/mainImg.png"
              alt="일기장에 누워있는 사람"
              className="main-image"
            />
          </div>
        </main>
      </div>

      <section
        ref={el => sectionRefs.current[0] = el}
        id="section-0"
        className={`scroll-section ${visibleSections['section-0'] ? 'is-visible' : ''}`}
      >
        <h2 className="scroll-section-title">하루메일은 말이죠..</h2>
        <p className="scroll-section-subtitle">
          바쁜 일상 속, 숨 쉴 틈 한 줌! <br />
          하루 한 번, 이메일로 당신의 하루를 기록할 수 있게 도와드릴게요.
        </p>
        <div className="scroll-section-content">
          <div
            id="item-0-0"
            ref={el => setContentItemRef(el, 'item-0-0')}
            className={`content-item ${visibleContentItems['item-0-0'] ? 'is-visible' : ''}`}
          >
            <div className="content-item-icon">
              <img src="/images/thinkingFace.png" alt="고민하는 사람 아이콘" />
            </div>
            <h3 className="content-item-title">어떤 주제로 기록하지?</h3>
            <p className="content-item-description">
              일기 쓰기가 막막할 때, 매일 도착하는 질문으로 하루를 돌아보고 의미 있게 마무리하세요.
            </p>
          </div>
          <div
            id="item-0-1"
            ref={el => setContentItemRef(el, 'item-0-1')}
            className={`content-item ${visibleContentItems['item-0-1'] ? 'is-visible' : ''}`}
          >
            <div className="content-item-icon">
              <img src="/images/mail.png" alt="메일 아이콘" />
            </div>
            <h3 className="content-item-title">매일 새로워지는 질문</h3>
            <p className="content-item-description">
              매일 다른 질문을 받아보며, 하루를 깊이 있게 성찰할 수 있습니다.
            </p>
          </div>
          <div
            id="item-0-2"
            ref={el => setContentItemRef(el, 'item-0-2')}
            className={`content-item ${visibleContentItems['item-0-2'] ? 'is-visible' : ''}`}
          >
            <div className="content-item-icon">
               <img src="/images/laptop.png" alt="노트북 사람 아이콘" />
            </div>
            <h3 className="content-item-title">꾸준한 기록 습관 만들기</h3>
            <p className="content-item-description">
              매일 꾸준히 기록하면서 자연스럽게 나만의 소중한 기록 습관을 만들어가세요.
            </p>
          </div>
        </div>
      </section>

      <section
        ref={el => sectionRefs.current[1] = el}
        id="section-1"
        className={`scroll-section ${visibleSections['section-1'] ? 'is-visible' : ''}`}
      >
         <h2 className="scroll-section-title">하루메일과 함께 매일 새로운 질문이 도착!</h2>
         <p className="scroll-section-subtitle">
           메일함에 쏙! 들어오는 하루 기록 질문으로
           즐겁게 하루를 되돌아보세요.
         </p>
         <img
           src="/images/mailTemp.png"
           alt="일기 질문 메일링 예시"
           className="qna-board-image"
         />
      </section>

      {/* ⭐ 구독 모달 (기존과 동일) */}
      {showSubscribeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>하루 일기 구독</h2>
            <p>메일 수신 빈도를 선택해주세요!</p>
            <div className="frequency-options">
              <label className="frequency-option">
                <input
                  type="radio"
                  name="frequency"
                  value="daily"
                  checked={selectedFrequency === 'daily'}
                  onChange={() => setSelectedFrequency('daily')}
                />
                <span className="custom-checkbox">🐥 매일</span>
              </label>
              <label className="frequency-option">
                <input
                  type="radio"
                  name="frequency"
                  value="every_other_day"
                  checked={selectedFrequency === 'every_other_day'}
                  onChange={() => setSelectedFrequency('every_other_day')}
                />
                <span className="custom-checkbox">🐢 격일</span>
              </label>
              <label className="frequency-option">
                <input
                  type="radio"
                  name="frequency"
                  value="weekly"
                  checked={selectedFrequency === 'weekly'}
                  onChange={() => setSelectedFrequency('weekly')}
                />
                <span className="custom-checkbox">🐻 주 1회</span>
              </label>
            </div>
            <label className="agree-checkbox">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              />
              <span> 메일 수신에 동의합니다.</span>
            </label>

            {!isAgreed && (
              <p className="warning-text">메일 수신에 동의해야 시작할 수 있어요.</p>
            )}

            <button
              className={`google-login ${!isAgreed ? 'disabled' : ''}`}
              onClick={handleGoogleLoginForSubscribe}
              disabled={!isAgreed}
            >
              Google Mail로 시작하기!
            </button>
            <button className="close-button" onClick={handleCloseSubscribeModal}>
              닫기
            </button>
          </div>
        </div>
      )}

      {/* ⭐ 로그인 모달 (수정된 부분) */}
      {showLoginModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>기존 구독자 로그인</h2>
            <p className="modal-subtitle-small">구독에 사용하신 이메일 주소를 입력해주세요.</p>
            <p className="modal-note-small modal-whisper-text">구독자 확인을 위한 과정이에요!</p>
            <div className="email-input-container"> {/* ⭐ 새로운 컨테이너 추가 */}
              <input
                type="text" // ⭐ type을 text로 변경
                placeholder="사용자 이름"
                value={displayEmail} // ⭐ displayEmail 사용
                onChange={handleEmailInputChange} // ⭐ 새로운 핸들러 사용
                className="modal-email-input"
              />
              <span className="domain-suffix">@gmail.com</span> {/* ⭐ 도메인 접미사 */}
            </div>
            {/* ⭐ 에러 메시지 또는 안내 메시지 */}
            {loginErrorMessage && (
                <p className={`warning-text ${isEmailVerified === true ? 'success-text' : ''}`}>
                    {loginErrorMessage}
                </p>
            )}

            {/* ⭐ 이메일 확인 버튼 (확인 전 또는 확인 실패 시) */}
            {isEmailVerified === null || isEmailVerified === false ? (
                <button
                    className="modal-verify-email-button" // ⭐ CSS 클래스 적용
                    onClick={handleCheckExistingUserEmail}
                    disabled={!displayEmail || loginErrorMessage.includes("유효한 Gmail 주소")} // ⭐ displayEmail로 disabled 조건 변경
                >
                    이메일 확인
                </button>
            ) : null}

            {/* ⭐ 이메일이 등록된 경우 활성화되는 로그인 버튼 */}
            {isEmailVerified === true && (
                <button
                    className="google-login" // 기존 구글 로그인 버튼 스타일 재활용
                    onClick={handleGoogleLoginForVerifiedUser}
                >
                    Google 계정으로 로그인하기
                </button>
            )}

            {/* ⭐ 이메일이 등록되지 않은 경우 활성화되는 구독 버튼 */}
            {isEmailVerified === false && (
                <button
                    className="google-login modal-subscribe-button-red" // ⭐ CSS 클래스 적용
                    onClick={handleSubscribeForNewUser}
                >
                    지금 하루 메일 구독하기!
                </button>
            )}

            <br/>
            <button className="close-button" onClick={handleCloseLoginModal}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;