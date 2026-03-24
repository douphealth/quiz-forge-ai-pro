import { SignupForm } from "@/components/auth/SignupForm";
import { motion } from "framer-motion";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <SignupForm />
      </motion.div>
    </div>
  );
}
