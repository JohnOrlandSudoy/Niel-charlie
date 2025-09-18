// Password Strength Utility
export interface PasswordStrength {
  score: number; // 0-4
  level: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  feedback: string[];
  requirements: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (requirements.length) {
    score += 1;
  } else {
    feedback.push('At least 8 characters');
  }

  // Lowercase check
  if (requirements.lowercase) {
    score += 1;
  } else {
    feedback.push('One lowercase letter');
  }

  // Uppercase check
  if (requirements.uppercase) {
    score += 1;
  } else {
    feedback.push('One uppercase letter');
  }

  // Number check
  if (requirements.number) {
    score += 1;
  } else {
    feedback.push('One number');
  }

  // Special character check
  if (requirements.special) {
    score += 1;
  } else {
    feedback.push('One special character');
  }

  // Additional length bonus
  if (password.length >= 12) {
    score += 0.5;
  }

  // Determine level and color
  let level: PasswordStrength['level'];
  let color: string;

  if (score < 2) {
    level = 'Very Weak';
    color = 'text-red-600';
  } else if (score < 3) {
    level = 'Weak';
    color = 'text-orange-600';
  } else if (score < 4) {
    level = 'Fair';
    color = 'text-yellow-600';
  } else if (score < 5) {
    level = 'Good';
    color = 'text-blue-600';
  } else {
    level = 'Strong';
    color = 'text-green-600';
  }

  return {
    score: Math.min(Math.floor(score), 4),
    level,
    color,
    feedback,
    requirements,
  };
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'bg-red-500';
    case 2:
      return 'bg-orange-500';
    case 3:
      return 'bg-yellow-500';
    case 4:
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

export const getPasswordStrengthWidth = (score: number): string => {
  const percentage = (score / 4) * 100;
  return `${percentage}%`;
};
