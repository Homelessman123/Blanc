import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card, Dropdown } from '../components/ui/Common';
import { api, authToken, API_BASE_URL } from '../lib/api';
import { Check, User, Briefcase, MapPin, Code, Target, Shield, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

interface RegisterInitiateResponse {
  ok: boolean;
  message: string;
  sessionToken: string;
  expiresAt: string;
}

interface LoginInitiateResponse {
  ok: boolean;
  requiresOTP: boolean;
  sessionToken?: string;
  message?: string;
  email?: string;
  expiresAt?: string;
  // For direct login (bypass OTP)
  token?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

// Generate secure session token (32 bytes hex)
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const ensureAuthSession = (token: string) => {
  authToken.set(token);

  void (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
      });

      if (res.ok) {
        authToken.clear();
        return;
      }
    } catch {
      // Keep session token; don't persist on transient network issues.
    }
  })();
};

// Simple OTP Input component for Auth page
// Dùng uncontrolled input để tránh conflict với bộ gõ tiếng Việt
const SimpleOtpInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync value to inputs khi value thay đổi từ bên ngoài (reset)
  useEffect(() => {
    inputRefs.current.forEach((input, i) => {
      if (input) {
        input.value = value[i] || '';
      }
    });
  }, [value]);

  const collectValue = () => {
    return inputRefs.current.map(input => input?.value || '').join('');
  };

  const handleInput = (index: number) => {
    const input = inputRefs.current[index];
    if (!input) return;

    // Chỉ giữ lại số
    const digit = input.value.replace(/\D/g, '').slice(-1);
    input.value = digit;

    onChange(collectValue());

    // Focus ô tiếp theo nếu đã nhập
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = inputRefs.current[index];

    if (e.key === 'Backspace') {
      if (!input?.value && index > 0) {
        e.preventDefault();
        const prevInput = inputRefs.current[index - 1];
        if (prevInput) {
          prevInput.value = '';
          prevInput.focus();
          onChange(collectValue());
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    inputRefs.current.forEach((input, i) => {
      if (input) {
        input.value = pasted[i] || '';
      }
    });

    onChange(pasted);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div ref={containerRef} className="flex gap-3" onPaste={handlePaste}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="tel"
          pattern="[0-9]*"
          maxLength={1}
          defaultValue=""
          onInput={() => handleInput(index)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          placeholder="•"
          autoComplete="off"
          data-form-type="other"
          className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 bg-white outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      ))}
    </div>
  );
};

// Step Progress Indicator Component - Updated for 4 steps in registration
const StepProgress: React.FC<{ currentStep: number; isAnimating: boolean; totalSteps?: number }> = ({
  currentStep,
  isAnimating,
  totalSteps = 4
}) => {
  const { locale } = useI18n();
  const labels = locale === 'en'
    ? { account: 'Account', verify: 'Verify', profile: 'Profile', terms: 'Terms' }
    : { account: 'Tài khoản', verify: 'Xác thực', profile: 'Hồ sơ', terms: 'Điều khoản' };
  const steps = totalSteps === 4
    ? [{ label: labels.account, num: 1 }, { label: labels.verify, num: 2 }, { label: labels.profile, num: 3 }, { label: labels.terms, num: 4 }]
    : [{ label: labels.account, num: 1 }, { label: labels.profile, num: 2 }];

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${currentStep > step.num
                ? 'bg-primary-600 text-white'
                : currentStep === step.num
                  ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                  : 'border-2 border-slate-300 text-slate-400'
                }`}
            >
              {currentStep > step.num ? <Check className="w-5 h-5" /> : step.num}
            </div>
            <span className={`text-xs mt-2 font-medium ${currentStep >= step.num ? 'text-primary-600' : 'text-slate-400'}`}>
              {step.label}
            </span>
          </div>

          {/* Connecting Line */}
          {index < steps.length - 1 && (
            <div className="relative w-16 h-1 mx-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full bg-primary-600 rounded-full transition-all duration-700 ease-out ${isAnimating ? 'animate-pulse' : ''
                  } ${currentStep > step.num ? 'w-full' : 'w-0'}`}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const Auth: React.FC<{ type: 'login' | 'register' }> = ({ type }) => {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isLogin = type === 'login';

  const copy = useMemo(() => {
    if (locale === 'en') {
      return {
        common: {
          genericError: 'Something went wrong',
          processing: 'Processing...',
          continue: 'Continue',
          back: 'Back',
        },
        footer: {
          noAccount: "Don't have an account?",
          hasAccount: 'Already have an account? ',
          signUpNow: 'Sign up now',
          signInNow: 'Sign in now',
        },
        steps: {
          termsTitle: 'Terms of service',
          termsSubtitle: 'Please read and accept our terms before continuing',
          termsBox: {
            title: '📋 Terms of Service',
            body: 'By using Blanc, you agree to follow our content, behavior, and service rules.',
          },
          privacyBox: {
            title: '🔒 Privacy policy',
            body: 'We are committed to protecting your personal information and using it only to provide the service.',
          },
          communityBox: {
            title: '🤝 Community guidelines',
            body: 'Respect each other, no spam, and no illegal content.',
          },
          agreeTermsPrefix: 'I have read and agree to the',
          termsLink: 'Terms of service',
          privacyLink: 'Privacy policy',
          agreePrivacyPrefix: 'I have read and agree to the',
          createAccount: 'Agree and create account',
          creatingAccount: 'Creating account...',
          ageConfirm: 'By continuing, you confirm you are at least 13 years old',
        },
        register: {
          nameLabel: 'Full name',
          namePlaceholder: 'John Doe',
          emailLabel: 'Email',
          emailPlaceholder: 'example@email.com',
          passwordLabel: 'Password',
          rememberMe: 'Remember me',
        },
        otp: {
          title: 'Verify email',
          sentTo: 'We sent a verification code to',
          expiresIn: 'Code expires in:',
          verify: 'Verify',
          verifying: 'Verifying...',
          noCode: "Didn't receive a code?",
          resendIn: 'Resend in {{count}}s',
          resending: 'Sending...',
          resend: 'Resend code',
          back: '← Back',
        },
        profile: {
          greet: 'Hi {{name}}! Tell us more about you.',
          primaryRole: 'Your primary role',
          rolePlaceholder: 'Select a role...',
          roleHeader: 'Select a role',
          roles: {
            developer: 'Developer',
            designer: 'Designer',
            product: 'Product Manager',
            data: 'Data/AI',
            business: 'Business',
            student: 'Student',
            other: 'Other',
          },
          experience: 'Experience level',
          experiencePlaceholder: 'Select level...',
          experienceHeader: 'Select level',
          levels: {
            beginner: 'Beginner (0-1 year)',
            junior: 'Junior (1-2 years)',
            middle: 'Mid-level (2-4 years)',
            senior: 'Senior (4+ years)',
            expert: 'Expert/Lead',
          },
          location: 'Location',
          locationPlaceholder: 'e.g., Hanoi, Ho Chi Minh City...',
          skills: 'Key skills',
          skillsPlaceholder: 'React, Python, Design... (comma separated)',
          goals: 'Learning goals',
          goalsPlaceholder: 'What do you want to achieve with Blanc?',
        },
        login: {
          forgotPassword: 'Forgot password?',
          submit: 'Sign in',
        },
        twoFa: {
          title: 'Two-step verification',
          subtitlePrefix: 'Enter the 6-digit code from Authenticator for',
          note: 'Code is generated in Authenticator (not sent by email).',
          expiresIn: 'Session expires in:',
          submit: 'Sign in',
          verifying: 'Verifying...',
          noCode: 'No code? Open Authenticator to get the 6-digit code.',
          back: '← Back to sign in',
          headerTitle: 'Security verification',
          headerSubtitle: 'Please enter the 6-digit code from Authenticator to complete sign-in.',
        },
        headers: {
          loginTitle: 'Welcome back!',
          loginSubtitle: 'Enter your details to continue your learning journey.',
          registerTitle: 'Create a new account',
          registerSubtitle: 'Join the largest learning community in Vietnam.',
          verifyTitle: 'Verify email',
          verifySubtitle: 'Enter the OTP sent to your email.',
          profileTitle: 'Complete your profile',
          profileSubtitle: 'Help us understand you for better recommendations.',
          termsTitle: 'Terms of service',
          termsSubtitle: 'Please read and accept our terms.',
        },
        rightPanel: {
          securityTitle: 'Account security',
          securityDescription: 'Two-step verification helps protect your account from unauthorized access.',
          welcomeTitle: 'Welcome to Blanc!',
          welcomeDescription: 'Before you start, take a moment to review our terms.',
          verifyTitle: 'Verify email',
          verifyDescription: 'We need to confirm your email to keep your account secure.',
          almostDoneTitle: 'Almost done!',
          almostDoneDescription: 'Your info helps us recommend the best contests and teammates.',
          defaultTitle: 'Unlimited learning',
          defaultDescription: '"Education is the most powerful weapon you can use to change the world." - Nelson Mandela',
        },
        validation: {
          otpLength: 'Please enter all 6 digits.',
          sessionExpired: 'Your verification session has expired. Please register again.',
          profileIncomplete: 'Please complete your profile (role & experience) before creating an account.',
          primaryRoleRequired: 'Please select your primary role.',
          experienceRequired: 'Please select your experience level.',
        },
        errors: {
          register: {
            'User already exists.': 'This email is already registered. Please use another email or sign in.',
            'Email đã được đăng ký.': 'This email is already registered. Please use another email or sign in.',
            'Invalid credentials.': 'Email or password is incorrect. Please try again.',
            'Email and password are required.': 'Please enter both email and password.',
            'Name, email, and password are required.': 'Please enter full name, email, and password.',
            'Họ tên, email và mật khẩu là bắt buộc.': 'Please enter full name, email, and password.',
          },
          login: {
            'Invalid credentials.': 'Email or password is incorrect. Please try again.',
            'Email và mật khẩu không đúng.': 'Email or password is incorrect. Please try again.',
            'Email and password are required.': 'Please enter both email and password.',
            'Valid session token is required.': 'Session error. Please try again.',
          },
        },
      } as const;
    }

    return {
      common: {
        genericError: 'Đã xảy ra lỗi',
        processing: 'Đang xử lý...',
        continue: 'Tiếp tục',
        back: 'Quay lại',
      },
      footer: {
        noAccount: 'Chưa có tài khoản?',
        hasAccount: 'Đã có tài khoản? ',
        signUpNow: 'Đăng ký ngay',
        signInNow: 'Đăng nhập ngay',
      },
      steps: {
        termsTitle: 'Điều khoản sử dụng',
        termsSubtitle: 'Vui lòng đọc và đồng ý với các điều khoản trước khi tiếp tục',
        termsBox: {
          title: '📋 Điều khoản dịch vụ',
          body: 'Bằng việc sử dụng Blanc, bạn đồng ý tuân thủ các quy định về nội dung, hành vi và sử dụng dịch vụ của chúng tôi.',
        },
        privacyBox: {
          title: '🔒 Chính sách bảo mật',
          body: 'Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn và chỉ sử dụng cho mục đích cung cấp dịch vụ.',
        },
        communityBox: {
          title: '🤝 Quy tắc cộng đồng',
          body: 'Tôn trọng lẫn nhau, không spam, không chia sẻ nội dung vi phạm pháp luật.',
        },
        agreeTermsPrefix: 'Tôi đã đọc và đồng ý với',
        termsLink: 'Điều khoản sử dụng',
        privacyLink: 'Chính sách bảo mật',
        agreePrivacyPrefix: 'Tôi đã đọc và đồng ý với',
        createAccount: 'Đồng ý và tạo tài khoản',
        creatingAccount: 'Đang tạo tài khoản...',
        ageConfirm: 'Bằng việc tiếp tục, bạn xác nhận đã đủ 13 tuổi trở lên',
      },
      register: {
        nameLabel: 'Họ và tên',
        namePlaceholder: 'Nguyễn Văn A',
        emailLabel: 'Email',
        emailPlaceholder: 'example@email.com',
        passwordLabel: 'Mật khẩu',
        rememberMe: 'Ghi nhớ tôi',
      },
      otp: {
        title: 'Xác thực email',
        sentTo: 'Chúng tôi đã gửi mã xác thực đến',
        expiresIn: 'Mã hết hạn sau:',
        verify: 'Xác nhận',
        verifying: 'Đang xác thực...',
        noCode: 'Không nhận được mã?',
        resendIn: 'Gửi lại sau {{count}}s',
        resending: 'Đang gửi...',
        resend: 'Gửi lại mã',
        back: '← Quay lại',
      },
      profile: {
        greet: 'Chào {{name}}! Hãy cho chúng tôi biết thêm về bạn.',
        primaryRole: 'Vai trò chính của bạn',
        rolePlaceholder: 'Chọn vai trò...',
        roleHeader: 'Chọn vai trò',
        roles: {
          developer: 'Lập trình viên',
          designer: 'Thiết kế',
          product: 'Product Manager',
          data: 'Data/AI',
          business: 'Kinh doanh',
          student: 'Sinh viên',
          other: 'Khác',
        },
        experience: 'Cấp độ kinh nghiệm',
        experiencePlaceholder: 'Chọn cấp độ...',
        experienceHeader: 'Chọn cấp độ',
        levels: {
          beginner: 'Mới bắt đầu (0-1 năm)',
          junior: 'Junior (1-2 năm)',
          middle: 'Middle (2-4 năm)',
          senior: 'Senior (4+ năm)',
          expert: 'Expert/Lead',
        },
        location: 'Địa điểm',
        locationPlaceholder: 'Ví dụ: Hà Nội, TP.HCM...',
        skills: 'Kỹ năng chính',
        skillsPlaceholder: 'React, Python, Design... (ngăn cách bằng dấu phẩy)',
        goals: 'Mục tiêu học tập',
        goalsPlaceholder: 'Bạn muốn đạt được điều gì khi tham gia Blanc?',
      },
      login: {
        forgotPassword: 'Quên mật khẩu?',
        submit: 'Đăng nhập',
      },
      twoFa: {
        title: 'Xác thực 2 bước',
        subtitlePrefix: 'Nhập mã 6 số từ ứng dụng Authenticator cho tài khoản',
        note: 'Mã được tạo trong ứng dụng Authenticator (không gửi qua email).',
        expiresIn: 'Phiên xác thực hết hạn sau:',
        submit: 'Đăng nhập',
        verifying: 'Đang xác thực...',
        noCode: 'Không có mã? Hãy mở ứng dụng Authenticator để lấy mã 6 số.',
        back: '← Quay lại đăng nhập',
        headerTitle: 'Xác thực bảo mật',
        headerSubtitle: 'Vui lòng nhập mã 6 số từ ứng dụng Authenticator để hoàn tất đăng nhập.'
      },
      headers: {
        loginTitle: 'Chào mừng trở lại!',
        loginSubtitle: 'Nhập thông tin để tiếp tục hành trình học tập.',
        registerTitle: 'Tạo tài khoản mới',
        registerSubtitle: 'Tham gia cộng đồng học tập lớn nhất Việt Nam.',
        verifyTitle: 'Xác thực email',
        verifySubtitle: 'Nhập mã OTP đã gửi đến email của bạn.',
        profileTitle: 'Hoàn thiện hồ sơ',
        profileSubtitle: 'Giúp chúng tôi hiểu bạn hơn để gợi ý phù hợp.',
        termsTitle: 'Điều khoản sử dụng',
        termsSubtitle: 'Vui lòng đọc và đồng ý với các điều khoản của chúng tôi.',
      },
      rightPanel: {
        securityTitle: 'Bảo mật tài khoản',
        securityDescription: 'Xác thực 2 bước giúp bảo vệ tài khoản của bạn khỏi truy cập trái phép.',
        welcomeTitle: 'Chào mừng đến Blanc!',
        welcomeDescription: 'Trước khi bắt đầu, hãy dành chút thời gian để đọc các điều khoản của chúng tôi.',
        verifyTitle: 'Xác thực email',
        verifyDescription: 'Chúng tôi cần xác nhận email để đảm bảo tính bảo mật cho tài khoản của bạn.',
        almostDoneTitle: 'Sắp hoàn tất!',
        almostDoneDescription: 'Thông tin của bạn sẽ giúp chúng tôi gợi ý cuộc thi và đồng đội phù hợp nhất.',
        defaultTitle: 'Học tập không giới hạn',
        defaultDescription: '"Giáo dục là vũ khí mạnh nhất mà bạn có thể dùng để thay đổi thế giới." - Nelson Mandela',
      },
      validation: {
        otpLength: 'Vui lòng nhập đầy đủ 6 chữ số.',
        sessionExpired: 'Phiên xác thực đã hết hạn. Vui lòng đăng ký lại.',
        profileIncomplete: 'Vui lòng hoàn thiện hồ sơ (vai trò & cấp độ kinh nghiệm) trước khi tạo tài khoản.',
        primaryRoleRequired: 'Vui lòng chọn vai trò chính của bạn.',
        experienceRequired: 'Vui lòng chọn cấp độ kinh nghiệm của bạn.',
      },
      errors: {
        register: {
          'User already exists.': 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
          'Email đã được đăng ký.': 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.',
          'Invalid credentials.': 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
          'Email and password are required.': 'Vui lòng nhập đầy đủ email và mật khẩu.',
          'Name, email, and password are required.': 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.',
          'Họ tên, email và mật khẩu là bắt buộc.': 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu.',
        },
        login: {
          'Invalid credentials.': 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
          'Email và mật khẩu không đúng.': 'Email hoặc mật khẩu không đúng. Vui lòng thử lại.',
          'Email and password are required.': 'Vui lòng nhập đầy đủ email và mật khẩu.',
          'Valid session token is required.': 'Lỗi phiên làm việc. Vui lòng thử lại.',
        },
      },
    } as const;
  }, [locale]);

  // Step state for registration (1: Account, 2: OTP, 3: Profile, 4: Terms)
  const [currentStep, setCurrentStep] = useState(1);

  // Terms acceptance state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Form data for step 1
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  // Form data for step 3 (profile info)
  const [profileData, setProfileData] = useState({
    primaryRole: '',
    experienceLevel: '',
    location: '',
    skills: '',
    learningGoals: '',
  });

  // OTP related state
  const [sessionToken, setSessionToken] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);

  // 2FA state for login
  const [requires2FA, setRequires2FA] = useState(false);
  const [login2FASessionToken, setLogin2FASessionToken] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationVerificationToken, setRegistrationVerificationToken] = useState<string>('');

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // OTP expiration timer display
  const getExpirationDisplay = useCallback(() => {
    if (!otpExpiresAt) return '';
    const now = new Date();
    const diff = Math.max(0, Math.floor((otpExpiresAt.getTime() - now.getTime()) / 1000));
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [otpExpiresAt]);

  const [expirationDisplay, setExpirationDisplay] = useState('');

  useEffect(() => {
    if (!otpExpiresAt) {
      setExpirationDisplay('');
      return;
    }

    setExpirationDisplay(getExpirationDisplay());
    const timer = setInterval(() => {
      setExpirationDisplay(getExpirationDisplay());
    }, 1000);
    return () => clearInterval(timer);
  }, [otpExpiresAt, getExpirationDisplay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle step 1 submit (initiate registration with OTP)
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Generate session token for OTP verification
      const newSessionToken = generateSessionToken();

      // Step 1: Initiate registration with sessionToken
      const response = await api.post<RegisterInitiateResponse>('/auth/register/initiate', {
        ...formData,
        sessionToken: newSessionToken,
      });

      // Save session token for OTP verification
      setSessionToken(newSessionToken);

      // Step 2: Request OTP to be sent to email
      await api.post('/otp/request', {
        email: formData.email,
        sessionToken: newSessionToken,
        action: 'register_verify',
      });

      setOtpExpiresAt(new Date(response.expiresAt));
      setCountdown(60); // Start 60s countdown for resend

      // Start animation and move to step 2 (OTP)
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(2);
        setIsAnimating(false);
      }, 700);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : copy.common.genericError;
      setError(copy.errors.register[errorMessage] || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification for registration
  const handleOtpVerify = async () => {
    if (otp.length !== 6) {
      setOtpError(copy.validation.otpLength);
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    try {
      // Step 1: Verify OTP via /otp/verify endpoint
      const otpResult = await api.post<{
        ok: boolean;
        verificationToken: string;
        action: string;
      }>('/otp/verify', {
        email: formData.email,
        sessionToken,
        otp,
      });

      // Bind verification token for final registration step
      await api.post('/auth/register/verify', {
        email: formData.email,
        verificationToken: otpResult.verificationToken,
      });

      setRegistrationVerificationToken(otpResult.verificationToken);

      // Move to step 3 (Profile)
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(3);
        setIsAnimating(false);
      }, 700);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : copy.common.genericError;
      setOtpError(errorMessage);
      // Reset OTP input on error
      setOtp('');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle resend OTP for registration
  const handleResendOtp = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setOtpError('');

    try {
      const newSessionToken = generateSessionToken();

      await api.post('/otp/request', {
        email: formData.email,
        sessionToken: newSessionToken,
        action: 'register_verify',
      });

      setSessionToken(newSessionToken);
      setOtpExpiresAt(new Date(Date.now() + 2 * 60 * 1000)); // 2 minutes
      setCountdown(60);
      setOtp('');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : copy.common.genericError;
      setOtpError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  // Navigation helpers
  const goToTermsStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(4);
      setIsAnimating(false);
    }, 700);
  };

  const finishRegistration = () => {
    // Finalize registration only after terms are accepted
    // (Account is created here, not at OTP verification)
    const finalize = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (!registrationVerificationToken) {
          setError(copy.validation.sessionExpired);
          return;
        }

        if (!profileData.primaryRole || !profileData.experienceLevel) {
          setError(copy.validation.profileIncomplete);
          setCurrentStep(3);
          return;
        }

        const response = await api.post<AuthResponse>('/auth/register/complete', {
          email: formData.email,
          verificationToken: registrationVerificationToken,
          profile: {
            primaryRole: profileData.primaryRole,
            experienceLevel: profileData.experienceLevel,
            location: profileData.location,
            skills: profileData.skills,
            learningGoals: profileData.learningGoals,
          },
          termsAccepted,
          privacyAccepted,
        });

        ensureAuthSession(response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        window.dispatchEvent(new Event('auth-change'));
        navigate('/profile');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : copy.common.genericError;
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    void finalize();
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Account is not created yet, so we only collect profile data locally
    // but require minimum profile fields before moving forward.
    if (!profileData.primaryRole) {
      setError(copy.validation.primaryRoleRequired);
      return;
    }

    if (!profileData.experienceLevel) {
      setError(copy.validation.experienceRequired);
      return;
    }

    goToTermsStep();
  };

  // Handle login submit - optional 2FA (TOTP)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Generate session token (bind pending 2FA session)
      const newSessionToken = generateSessionToken();

      const response = await api.post<LoginInitiateResponse>('/auth/login/initiate', {
        email: formData.email,
        password: formData.password,
        sessionToken: newSessionToken,
      });

      if (response.requiresOTP) {
        // 2FA is enabled for this account - require TOTP from authenticator app
        const otpSessionToken = response.sessionToken || newSessionToken;

        setRequires2FA(true);
        setLogin2FASessionToken(otpSessionToken);
        setOtp('');
        setOtpError('');
        setCountdown(0);
        setIsResending(false);
        setOtpExpiresAt(response.expiresAt ? new Date(response.expiresAt) : null);
      } else if (response.token && response.user) {
        // Direct login (OTP bypassed for test accounts)
        ensureAuthSession(response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        window.dispatchEvent(new Event('auth-change'));
        navigate('/profile');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : copy.common.genericError;
      setError(copy.errors.login[errorMessage] || errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 2FA verification for login
  const handleLogin2FAVerify = async () => {
    if (otp.length !== 6) {
      setOtpError(copy.validation.otpLength);
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    try {
      const response = await api.post<AuthResponse>('/auth/login/verify-2fa', {
        email: formData.email,
        sessionToken: login2FASessionToken,
        otp,
      });

      ensureAuthSession(response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      window.dispatchEvent(new Event('auth-change'));
      navigate('/profile');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : copy.common.genericError;
      setOtpError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  // Render Step 4 Form (Terms & Conditions)
  const renderTermsForm = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <FileText className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{copy.steps.termsTitle}</h3>
        <p className="text-slate-600 text-sm">{copy.steps.termsSubtitle}</p>
      </div>

      {/* Terms Summary Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto text-sm text-slate-600 space-y-3">
        <div>
          <h4 className="font-semibold text-slate-800 mb-1">{copy.steps.termsBox.title}</h4>
          <p>{copy.steps.termsBox.body}</p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 mb-1">{copy.steps.privacyBox.title}</h4>
          <p>{copy.steps.privacyBox.body}</p>
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 mb-1">{copy.steps.communityBox.title}</h4>
          <p>{copy.steps.communityBox.body}</p>
        </div>
      </div>

      {/* Checkbox Agreements */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-800">
            {copy.steps.agreeTermsPrefix}{' '}
            <a
              href="/terms"
              target="_blank"
              className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
            >
              {copy.steps.termsLink}
              <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
          <span className="text-sm text-slate-600 group-hover:text-slate-800">
            {copy.steps.agreePrivacyPrefix}{' '}
            <a
              href="/privacy"
              target="_blank"
              className="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
            >
              {copy.steps.privacyLink}
              <ExternalLink className="w-3 h-3" />
            </a>
          </span>
        </label>
      </div>

      <Button
        type="button"
        className="w-full text-lg h-12"
        disabled={!termsAccepted || !privacyAccepted || isLoading}
        onClick={finishRegistration}
      >
        {isLoading ? copy.steps.creatingAccount : copy.steps.createAccount}
      </Button>

      <p className="text-xs text-slate-400 text-center">
        {copy.steps.ageConfirm}
      </p>
    </div>
  );

  // Render Step 1 Form (Account Info)
  const renderStep2Form = () => (
    <form className="space-y-5" onSubmit={handleStep1Submit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        label={copy.register.nameLabel}
        name="name"
        placeholder={copy.register.namePlaceholder}
        value={formData.name}
        onChange={handleChange}
        required
      />
      <Input
        label={copy.register.emailLabel}
        type="email"
        name="email"
        placeholder={copy.register.emailPlaceholder}
        value={formData.email}
        onChange={handleChange}
        required
      />
      <Input
        label={copy.register.passwordLabel}
        type="password"
        name="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        autoComplete="new-password"
        required
      />

      <div className="flex items-center text-sm">
        <label className="flex items-center text-slate-600">
          <input type="checkbox" className="mr-2 rounded text-primary-600 focus:ring-primary-500" />
          {copy.register.rememberMe}
        </label>
      </div>

      <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
        {isLoading ? copy.common.processing : copy.common.continue}
      </Button>
    </form>
  );

  // Render Step 2 Form (OTP Verification)
  const renderStep3OtpForm = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Shield className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{copy.otp.title}</h3>
        <p className="text-slate-600 text-sm">
          {copy.otp.sentTo}{' '}
          <span className="font-semibold text-primary-600">{formData.email}</span>
        </p>
        {expirationDisplay && (
          <p className="text-xs text-slate-500 mt-2">
            {copy.otp.expiresIn} <span className="font-mono font-semibold">{expirationDisplay}</span>
          </p>
        )}
      </div>

      {otpError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {otpError}
        </div>
      )}

      <div className="flex justify-center">
        <SimpleOtpInput
          value={otp}
          onChange={setOtp}
          disabled={isVerifying}
        />
      </div>

      <Button
        type="button"
        className="w-full text-lg h-12"
        disabled={isVerifying || otp.length !== 6}
        onClick={handleOtpVerify}
      >
        {isVerifying ? copy.otp.verifying : copy.otp.verify}
      </Button>

      <div className="text-center">
        <p className="text-sm text-slate-500 mb-2">{copy.otp.noCode}</p>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={countdown > 0 || isResending}
          className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${countdown > 0 || isResending
            ? 'text-slate-400 cursor-not-allowed'
            : 'text-primary-600 hover:text-primary-700'
            }`}
        >
          <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
          {countdown > 0
            ? copy.otp.resendIn.replace('{{count}}', String(countdown))
            : isResending
              ? copy.otp.resending
              : copy.otp.resend}
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          setCurrentStep(1);
          setOtp('');
          setOtpError('');
        }}
        className="w-full text-sm text-slate-500 hover:text-slate-700 mt-2"
      >
        {copy.otp.back}
      </button>
    </div>
  );

  // Render Step 3 Form (Profile Info)
  const renderStep4Form = () => (
    <form className="space-y-4" onSubmit={handleStep3Submit}>
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <User className="w-8 h-8 text-primary-600" />
        </div>
        <p className="text-slate-600 text-sm">
          {copy.profile.greet.replace('{{name}}', formData.name)}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Primary Role */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-400" />
          {copy.profile.primaryRole}
        </label>
        <Dropdown
          value={profileData.primaryRole}
          onChange={(value) => handleProfileChange({ target: { name: 'primaryRole', value } } as React.ChangeEvent<HTMLInputElement>)}
          placeholder={copy.profile.rolePlaceholder}
          headerText={copy.profile.roleHeader}
          options={[
            { value: '', label: copy.profile.rolePlaceholder },
            { value: 'developer', label: copy.profile.roles.developer },
            { value: 'designer', label: copy.profile.roles.designer },
            { value: 'product', label: copy.profile.roles.product },
            { value: 'data', label: copy.profile.roles.data },
            { value: 'business', label: copy.profile.roles.business },
            { value: 'student', label: copy.profile.roles.student },
            { value: 'other', label: copy.profile.roles.other }
          ]}
        />
      </div>

      {/* Experience Level */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
          <Target className="w-4 h-4 text-slate-400" />
          {copy.profile.experience}
        </label>
        <Dropdown
          value={profileData.experienceLevel}
          onChange={(value) => handleProfileChange({ target: { name: 'experienceLevel', value } } as React.ChangeEvent<HTMLInputElement>)}
          placeholder={copy.profile.experiencePlaceholder}
          headerText={copy.profile.experienceHeader}
          options={[
            { value: '', label: copy.profile.experiencePlaceholder },
            { value: 'beginner', label: copy.profile.levels.beginner },
            { value: 'junior', label: copy.profile.levels.junior },
            { value: 'middle', label: copy.profile.levels.middle },
            { value: 'senior', label: copy.profile.levels.senior },
            { value: 'expert', label: copy.profile.levels.expert }
          ]}
        />
      </div>

      {/* Location */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          {copy.profile.location}
        </label>
        <Input
          name="location"
          placeholder={copy.profile.locationPlaceholder}
          value={profileData.location}
          onChange={handleProfileChange}
        />
      </div>

      {/* Skills */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
          <Code className="w-4 h-4 text-slate-400" />
          {copy.profile.skills}
        </label>
        <Input
          name="skills"
          placeholder={copy.profile.skillsPlaceholder}
          value={profileData.skills}
          onChange={handleProfileChange}
        />
      </div>

      {/* Learning Goals */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {copy.profile.goals}
        </label>
        <textarea
          name="learningGoals"
          placeholder={copy.profile.goalsPlaceholder}
          value={profileData.learningGoals}
          onChange={handleProfileChange}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1 h-11" disabled={isLoading}>
          {isLoading ? copy.common.processing : copy.common.continue}
        </Button>
      </div>
    </form>
  );

  // Render Login Form
  const renderLoginForm = () => (
    <form className="space-y-5" onSubmit={handleLoginSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Input
        label={copy.register.emailLabel}
        type="email"
        name="email"
        placeholder={copy.register.emailPlaceholder}
        value={formData.email}
        onChange={handleChange}
        required
      />
      <Input
        label={copy.register.passwordLabel}
        type="password"
        name="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center text-slate-600">
          <input type="checkbox" className="mr-2 rounded text-primary-600 focus:ring-primary-500" />
          {copy.register.rememberMe}
        </label>
        <span onClick={() => navigate('/forgot-password')} className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
          {copy.login.forgotPassword}
        </span>
      </div>

      <Button type="submit" className="w-full text-lg h-12" disabled={isLoading}>
        {isLoading ? copy.common.processing : copy.login.submit}
      </Button>
    </form>
  );

  // Render 2FA verification for login (TOTP)
  const render2FAForm = () => (
    <div className="space-y-5">
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Shield className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">{copy.twoFa.title}</h3>
        <p className="text-slate-600 text-sm">
          {copy.twoFa.subtitlePrefix}{' '}
          <span className="font-semibold text-primary-600">{formData.email}</span>
        </p>
        <p className="text-xs text-slate-500 mt-2">{copy.twoFa.note}</p>
        {expirationDisplay && (
          <p className="text-xs text-slate-500 mt-2">
            {copy.twoFa.expiresIn} <span className="font-mono font-semibold">{expirationDisplay}</span>
          </p>
        )}
      </div>

      {otpError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {otpError}
        </div>
      )}

      <div className="flex justify-center">
        <SimpleOtpInput
          value={otp}
          onChange={setOtp}
          disabled={isVerifying}
        />
      </div>

      <Button
        type="button"
        className="w-full text-lg h-12"
        disabled={isVerifying || otp.length !== 6}
        onClick={handleLogin2FAVerify}
      >
        {isVerifying ? copy.twoFa.verifying : copy.twoFa.submit}
      </Button>

      <div className="text-center">
        <p className="text-sm text-slate-500">{copy.twoFa.noCode}</p>
      </div>

      <button
        type="button"
        onClick={() => {
          setRequires2FA(false);
          setOtp('');
          setOtpError('');
          setOtpExpiresAt(null);
        }}
        className="w-full text-sm text-slate-500 hover:text-slate-700 mt-2"
      >
        {copy.twoFa.back}
      </button>
    </div>
  );

  // Get title and subtitle based on current state
  const getHeaderContent = () => {
    if (isLogin) {
      if (requires2FA) {
        return {
          title: copy.twoFa.headerTitle,
          subtitle: copy.twoFa.headerSubtitle
        };
      }
      return {
        title: copy.headers.loginTitle,
        subtitle: copy.headers.loginSubtitle
      };
    }

    switch (currentStep) {
      case 1:
        return {
          title: copy.headers.registerTitle,
          subtitle: copy.headers.registerSubtitle
        };
      case 2:
        return {
          title: copy.headers.verifyTitle,
          subtitle: copy.headers.verifySubtitle
        };
      case 3:
        return {
          title: copy.headers.profileTitle,
          subtitle: copy.headers.profileSubtitle
        };
      case 4:
        return {
          title: copy.headers.termsTitle,
          subtitle: copy.headers.termsSubtitle
        };
      default:
        return { title: '', subtitle: '' };
    }
  };

  // Get right panel content based on current state
  const getRightPanelContent = () => {
    if (isLogin && requires2FA) {
      return {
        title: copy.rightPanel.securityTitle,
        description: copy.rightPanel.securityDescription
      };
    }
    if (!isLogin && currentStep === 4) {
      return {
        title: copy.rightPanel.welcomeTitle,
        description: copy.rightPanel.welcomeDescription
      };
    }
    if (!isLogin && currentStep === 2) {
      return {
        title: copy.rightPanel.verifyTitle,
        description: copy.rightPanel.verifyDescription
      };
    }
    if (!isLogin && currentStep === 3) {
      return {
        title: copy.rightPanel.almostDoneTitle,
        description: copy.rightPanel.almostDoneDescription
      };
    }
    return {
      title: copy.rightPanel.defaultTitle,
      description: copy.rightPanel.defaultDescription
    };
  };

  const { title, subtitle } = getHeaderContent();
  const rightPanel = getRightPanelContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-xl border-0">

        {/* Left: Form */}
        <div className="p-8 md:p-10 flex flex-col justify-center">
          {/* Step Progress for Registration */}
          {!isLogin && <StepProgress currentStep={currentStep} isAnimating={isAnimating} totalSteps={4} />}

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500 text-sm">{subtitle}</p>
          </div>

          {/* Render appropriate form */}
          {isLogin
            ? requires2FA
              ? render2FAForm()
              : renderLoginForm()
            : currentStep === 1
              ? renderStep2Form()
              : currentStep === 2
                ? renderStep3OtpForm()
                : currentStep === 3
                  ? renderStep4Form()
                  : renderTermsForm()}

          {/* Footer link - only show for step 1 or login (without 2FA) */}
          {((isLogin && !requires2FA) || (!isLogin && currentStep === 1)) && (
            <div className="mt-6 text-center text-sm text-slate-500">
              {isLogin ? copy.footer.noAccount : copy.footer.hasAccount}{" "}
              <span
                onClick={() => navigate(isLogin ? '/register' : '/login')}
                className="text-primary-600 hover:text-primary-700 font-bold cursor-pointer"
              >
                {isLogin ? copy.footer.signUpNow : copy.footer.signInNow}
              </span>
            </div>
          )}
        </div>

        {/* Right: Decoration */}
        <div className="hidden md:flex bg-primary-600 p-12 flex-col justify-between text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4">{rightPanel.title}</h3>
            <p className="text-primary-100">{rightPanel.description}</p>
          </div>

          {/* Abstract shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white opacity-10 rounded-full -translate-x-1/3 translate-y-1/3"></div>

          {/* Step indicator dots */}
          {!isLogin && (
            <div className="relative z-10 flex gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${currentStep >= 1 ? 'bg-white' : 'bg-white/30'}`} />
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`} />
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${currentStep >= 3 ? 'bg-white' : 'bg-white/30'}`} />
              <div className={`w-2 h-2 rounded-full transition-all duration-500 ${currentStep >= 4 ? 'bg-white' : 'bg-white/30'}`} />
            </div>
          )}

          <div className="relative z-10 text-sm opacity-80">© 2024 Blanc Inc.</div>
        </div>

      </Card>
    </div>
  );
};

export default Auth;
