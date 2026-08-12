export type PasswordRequirement = {
  key: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special'
  label: string
  met: boolean
}

export type PasswordFieldErrors = {
  currentPassword?: string
  newPassword?: string
  confirmNewPassword?: string
}

type PasswordValidationInput = {
  currentPassword?: string
  newPassword: string
  confirmNewPassword: string
  requireCurrentPassword?: boolean
  policy?: 'standard' | 'temporary'
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { key: 'length', label: 'Ít nhất 8 ký tự', met: password.length >= 8 },
    { key: 'uppercase', label: 'Chữ hoa', met: /\p{Lu}/u.test(password) },
    { key: 'lowercase', label: 'Chữ thường', met: /\p{Ll}/u.test(password) },
    { key: 'number', label: 'Chữ số', met: /\p{N}/u.test(password) },
    {
      key: 'special',
      label: 'Ký tự đặc biệt',
      met: /[^\p{L}\p{N}\s]/u.test(password),
    },
  ]
}

export function getTemporaryPasswordRequirements(password: string): PasswordRequirement[] {
  return [{ key: 'length', label: 'Ít nhất 5 ký tự', met: password.length >= 5 }]
}

export function validatePasswordFields({
  currentPassword = '',
  newPassword,
  confirmNewPassword,
  requireCurrentPassword = false,
  policy = 'standard',
}: PasswordValidationInput): PasswordFieldErrors {
  const errors: PasswordFieldErrors = {}
  const requirements =
    policy === 'temporary'
      ? getTemporaryPasswordRequirements(newPassword)
      : getPasswordRequirements(newPassword)

  if (requireCurrentPassword && !currentPassword) {
    errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.'
  }

  if (!newPassword) {
    errors.newPassword = 'Vui lòng nhập mật khẩu mới.'
  } else if (requirements.some((requirement) => !requirement.met)) {
    errors.newPassword =
      policy === 'temporary'
        ? 'Mật khẩu tạm phải có ít nhất 5 ký tự.'
        : 'Mật khẩu mới chưa đáp ứng đầy đủ yêu cầu.'
  } else if (requireCurrentPassword && newPassword === currentPassword) {
    errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.'
  }

  if (!confirmNewPassword) {
    errors.confirmNewPassword = 'Vui lòng xác nhận mật khẩu mới.'
  } else if (confirmNewPassword !== newPassword) {
    errors.confirmNewPassword = 'Mật khẩu xác nhận không khớp.'
  }

  return errors
}

export function hasPasswordErrors(errors: PasswordFieldErrors) {
  return Object.values(errors).some(Boolean)
}
