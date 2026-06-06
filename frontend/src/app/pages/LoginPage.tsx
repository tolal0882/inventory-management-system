import React, { useState, useEffect, useRef } from 'react';
import { Package, Mail, ArrowLeft, CheckCircle, KeyRound, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

// Forgot password steps: 'email' | 'otp' | 'reset' | 'success'
type ForgotStep = 'email' | 'otp' | 'reset' | 'success';

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ---------- Forgot Password state ----------
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');

  // Step 1 – email
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);

  // Step 2 – OTP
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3 – new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  // ---------- helpers ----------
  const startCountdown = (seconds = 60) => {
    setResendCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (countdownRef.current) clearInterval(countdownRef.current); }, []);

  const resetForgot = () => {
    setForgotStep('email');
    setForgotEmail('');
    setForgotEmailError('');
    setSendingCode(false);
    setOtpValue('');
    setOtpError('');
    setVerifyingCode(false);
    setResendCountdown(0);
    setNewPassword('');
    setConfirmPassword('');
    setShowNew(false);
    setShowConfirm(false);
    setResetError('');
    setResettingPassword(false);
    if (countdownRef.current) clearInterval(countdownRef.current);
  };

  // ---------- Login submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter both email and password'); return; }
    setSubmitting(true);
    try {
      const success = await onLogin(email, password);
      if (!success) setError('Invalid email or password.');
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Step 1: send code ----------
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotEmailError('');
    if (!forgotEmail) { setForgotEmailError('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) { setForgotEmailError('Please enter a valid email address.'); return; }

    setSendingCode(true);
    try {
      await authApi.requestOtp(forgotEmail);
      setOtpValue('');
      setOtpError('');
      setForgotStep('otp');
      startCountdown(40);
    } catch (err: any) {
      setForgotEmailError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  // ---------- Step 2: resend ----------
  const handleResend = async () => {
    setOtpValue('');
    setOtpError('');
    try {
      await authApi.requestOtp(forgotEmail);
      startCountdown(40);
    } catch {
      setOtpError('Failed to resend code. Please try again.');
    }
  };

  // ---------- Step 2: verify code ----------
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    if (otpValue.length < 6) { setOtpError('Please enter the full 6-digit code.'); return; }
    setVerifyingCode(true);
    try {
      await authApi.verifyOtp(forgotEmail, otpValue);
      setForgotStep('reset');
    } catch (err: any) {
      setOtpError(err.message || 'Incorrect code. Please check and try again.');
    } finally {
      setVerifyingCode(false);
    }
  };

  // ---------- Step 3: reset password ----------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (!newPassword) { setResetError('Please enter a new password.'); return; }
    if (newPassword.length < 8) { setResetError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match.'); return; }

    setResettingPassword(true);
    try {
      await authApi.resetPassword(forgotEmail, newPassword);
      setForgotStep('success');
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };

  // step labels
  const stepLabels = ['Email', 'Verify Code', 'New Password'];
  const stepIndex = forgotStep === 'email' ? 0 : forgotStep === 'otp' ? 1 : forgotStep === 'reset' ? 2 : 3;

  const spring = { type: "spring" as const, stiffness: 400, damping: 28 };

  const cardVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.92 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 22, staggerChildren: 0.1, delayChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 340, damping: 26 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f4ff] via-white to-[#f0e8ff] relative overflow-hidden">

      {/* Background blobs */}
      <motion.div
        className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25"
        animate={{ x: [0, 40, 0], y: [0, 60, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-60px] right-[-60px] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-25"
        animate={{ x: [0, -40, 0], y: [0, -50, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        animate={{ x: [0, 20, -20, 0], y: [0, -30, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-blue-400 opacity-30"
          style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
        />
      ))}

      <motion.div
        className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/60"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div className="flex flex-col items-center mb-8" variants={itemVariants}>
          <motion.div
            className="w-18 h-18 bg-gradient-to-br from-[#1E90FF] to-[#0055CC] rounded-2xl flex items-center justify-center mb-4 relative shadow-lg"
            style={{ width: 72, height: 72 }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
            whileHover={{ scale: 1.1, rotate: 8, boxShadow: "0 20px 40px rgba(30,144,255,0.4)" }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1E90FF] to-[#0055CC]"
              animate={{ boxShadow: ["0 0 0px rgba(30,144,255,0.4)", "0 0 30px rgba(30,144,255,0.7)", "0 0 0px rgba(30,144,255,0.4)"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <Package className="w-9 h-9 text-white relative z-10" />
          </motion.div>

          <motion.h1
            className="text-2xl font-bold text-gray-900 tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.3 }}
          >
            Inventory Pro
          </motion.h1>
          <motion.p
            className="text-gray-500 text-sm mt-1"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.4 }}
          >
            Sign in to your account
          </motion.p>
        </motion.div>

        {/* Login form */}
        <motion.form onSubmit={handleSubmit} className="space-y-4" variants={itemVariants}>

          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="email">Email</Label>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileFocus={{ scale: 1.01 }}
              transition={spring}
            >
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
              />
            </motion.div>
          </motion.div>

          <motion.div className="space-y-2" variants={itemVariants}>
            <Label htmlFor="password">Password</Label>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileFocus={{ scale: 1.01 }}
              transition={spring}
            >
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-[#1E90FF] focus:border-[#1E90FF]"
              />
            </motion.div>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, height: "auto", y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-200"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }} transition={spring}>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-[#1E90FF] to-[#0055CC] hover:from-[#1873CC] hover:to-[#0044AA] shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 rounded-xl py-5 text-base font-semibold"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={submitting ? "loading" : "idle"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center gap-2"
                >
                  {submitting ? <><Spinner /> Signing in…</> : 'Login'}
                </motion.span>
              </AnimatePresence>
            </Button>
          </motion.div>
        </motion.form>

        <motion.div className="mt-5 text-center" variants={itemVariants}>
          <motion.button
            type="button"
            onClick={() => { resetForgot(); setIsForgotOpen(true); }}
            className="text-sm text-[#1E90FF] hover:text-[#0055CC] transition-colors duration-200 font-medium"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            Forgot Password?
          </motion.button>
        </motion.div>
      </motion.div>

      {/* ───────── Forgot Password Modal ───────── */}
      <Dialog open={isForgotOpen} onOpenChange={(open) => { if (!open) resetForgot(); setIsForgotOpen(open); }}>
        <DialogContent className="w-[440px] max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#1E90FF]" />
              Forgot Password
            </DialogTitle>
          </DialogHeader>

          {/* Step Indicator (only shown on steps 0-2) */}
          {forgotStep !== 'success' && (
            <motion.div
              className="flex items-center gap-0 mt-1 mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {stepLabels.map((label, i) => (
                <React.Fragment key={label}>
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
                        ${i < stepIndex ? 'bg-[#1E90FF] text-white' : i === stepIndex ? 'bg-[#1E90FF] text-white ring-4 ring-blue-100' : 'bg-gray-200 text-gray-500'}`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                    >
                      {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
                    </motion.div>
                    <motion.span
                      className={`text-xs transition-colors duration-300 ${i <= stepIndex ? 'text-[#1E90FF] font-medium' : 'text-gray-400'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.1 + 0.1 }}
                    >
                      {label}
                    </motion.span>
                  </div>
                  {i < stepLabels.length - 1 && (
                    <motion.div
                      className={`flex-1 h-0.5 mb-4 mx-1 transition-colors duration-500 ${i < stepIndex ? 'bg-[#1E90FF]' : 'bg-gray-200'}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: i * 0.1 + 0.2 }}
                    />
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          )}

          {/* ── STEP 1: Email ── */}
          <AnimatePresence mode="wait">
            {forgotStep === 'email' && (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-3"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Mail className="w-5 h-5 text-[#1E90FF] shrink-0" />
                  <p className="text-sm text-blue-800">
                    Enter your registered email. We'll send a <span className="font-semibold">6-digit verification code</span> to confirm it's you. The code expires in <span className="font-semibold">60 seconds</span>.
                  </p>
                </motion.div>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <motion.div
                    className="space-y-1.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="forgot-email">Email Address</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      className="w-full transition-all duration-200 focus:ring-2 focus:ring-[#1E90FF]"
                      autoFocus
                    />
                    <AnimatePresence>
                      {forgotEmailError && (
                        <motion.p
                          className="text-sm text-red-600"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {forgotEmailError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <motion.div
                    className="flex gap-3 justify-end pt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button type="button" variant="outline" onClick={() => { resetForgot(); setIsForgotOpen(false); }}>Cancel</Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button type="submit" className="bg-[#1E90FF] hover:bg-[#1873CC]" disabled={sendingCode}>
                        {sendingCode ? (
                          <span className="flex items-center gap-2"><Spinner />Sending Code…</span>
                        ) : (
                          <span className="flex items-center gap-2"><Mail className="w-4 h-4" />Send Code</span>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 2: OTP ── */}
            {forgotStep === 'otp' && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="text-center mb-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-sm text-gray-600">
                    A 6-digit code was sent to{' '}
                    <span className="font-semibold text-gray-900">{forgotEmail}</span>.
                    Please check your inbox.
                  </p>
                </motion.div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <motion.div
                    className="flex flex-col items-center gap-2"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <Label className="self-start">Enter Verification Code</Label>
                    <InputOTP
                      maxLength={6}
                      value={otpValue}
                      onChange={val => { setOtpValue(val); setOtpError(''); }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-11 h-11 text-base" />
                        <InputOTPSlot index={1} className="w-11 h-11 text-base" />
                        <InputOTPSlot index={2} className="w-11 h-11 text-base" />
                        <InputOTPSlot index={3} className="w-11 h-11 text-base" />
                        <InputOTPSlot index={4} className="w-11 h-11 text-base" />
                        <InputOTPSlot index={5} className="w-11 h-11 text-base" />
                      </InputOTPGroup>
                    </InputOTP>
                    <AnimatePresence>
                      {otpError && (
                        <motion.p
                          className="text-sm text-red-600 self-start"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {otpError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Resend */}
                  <motion.div
                    className="text-center text-sm text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Didn't receive the code?{' '}
                    {resendCountdown > 0 ? (
                      <span className="text-gray-400">Resend in <span className="font-medium text-gray-600">{resendCountdown}s</span></span>
                    ) : (
                      <motion.button
                        type="button"
                        onClick={handleResend}
                        className="text-[#1E90FF] font-medium hover:underline"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Resend Code
                      </motion.button>
                    )}
                  </motion.div>

                  <motion.div
                    className="flex gap-3 justify-between"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button type="button" variant="outline" onClick={() => setForgotStep('email')} className="flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />Back
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button type="submit" className="bg-[#1E90FF] hover:bg-[#1873CC]" disabled={verifyingCode || otpValue.length < 6}>
                        {verifyingCode ? (
                          <span className="flex items-center gap-2"><Spinner />Verifying…</span>
                        ) : (
                          'Verify Code'
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 3: New Password ── */}
            {forgotStep === 'reset' && (
              <motion.div
                key="reset-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg mb-3"
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                >
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                  <p className="text-sm text-green-800">Identity verified! Set your new password below.</p>
                </motion.div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <motion.div
                    className="space-y-1.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNew ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full pr-10 transition-all duration-200 focus:ring-2 focus:ring-[#1E90FF]"
                        autoFocus
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowNew(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.button>
                    </div>
                  </motion.div>
                  <motion.div
                    className="space-y-1.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter your new password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full pr-10 transition-all duration-200 focus:ring-2 focus:ring-[#1E90FF]"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* Password strength hints */}
                  <motion.ul
                    className="text-xs text-gray-500 space-y-0.5 pl-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.li
                      className={`flex items-center gap-1 transition-colors duration-300 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}
                      animate={newPassword.length >= 8 ? { x: [0, 5, 0] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <span>{newPassword.length >= 8 ? '✓' : '○'}</span> At least 8 characters
                    </motion.li>
                    <motion.li
                      className={`flex items-center gap-1 transition-colors duration-300 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}
                      animate={/[A-Z]/.test(newPassword) ? { x: [0, 5, 0] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <span>{/[A-Z]/.test(newPassword) ? '✓' : '○'}</span> One uppercase letter
                    </motion.li>
                    <motion.li
                      className={`flex items-center gap-1 transition-colors duration-300 ${/\d/.test(newPassword) ? 'text-green-600' : ''}`}
                      animate={/\d/.test(newPassword) ? { x: [0, 5, 0] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <span>{/\d/.test(newPassword) ? '✓' : '○'}</span> One number
                    </motion.li>
                  </motion.ul>

                  <AnimatePresence>
                    {resetError && (
                      <motion.p
                        className="text-sm text-red-600"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {resetError}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.div
                    className="flex gap-3 justify-between pt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button type="button" variant="outline" onClick={() => setForgotStep('otp')} className="flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />Back
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button type="submit" className="bg-[#1E90FF] hover:bg-[#1873CC]" disabled={resettingPassword}>
                        {resettingPassword ? (
                          <span className="flex items-center gap-2"><Spinner />Resetting…</span>
                        ) : (
                          'Reset Password'
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 4: Success ── */}
            {forgotStep === 'success' && (
              <motion.div
                key="success-step"
                className="flex flex-col items-center text-center py-4 gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              >
                <motion.div
                  className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle className="w-9 h-9 text-green-600" />
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="font-semibold text-gray-900 text-base">Password Reset Successful!</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Your password has been updated. You can now log in with your new password.
                  </p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className="mt-2 bg-[#1E90FF] hover:bg-[#1873CC] px-8"
                    onClick={() => { resetForgot(); setIsForgotOpen(false); }}
                  >
                    Back to Login
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Inline spinner
function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
