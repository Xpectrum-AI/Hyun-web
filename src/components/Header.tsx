import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import haLogo from "@/assets/HA.png";

interface HeaderProps {
  onBookDemo: () => void;
}

const Header = ({ onBookDemo }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/#home", label: "HOME" },
    { to: "/solutions", label: "SOLUTIONS" },
    { to: "/about", label: "ABOUT US" },
    { to: "/partners", label: "PARTNERS" },
    { to: "/contact", label: "CONTACT" },
  ];

  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="absolute w-full top-0 left-0 bg-transparent z-50"
    >
      <div className="flex w-full max-w-7xl mx-auto items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center flex-shrink-0">
          <img
            src={haLogo}
            alt="HA Logo"
            className="w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] lg:w-[80px] lg:h-[80px] object-contain"
          />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 xl:gap-10">
          <nav className="flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm xl:text-base font-medium text-[#0c202b] whitespace-nowrap hover:opacity-70 transition-opacity"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Button 
            onClick={onBookDemo}
            className="px-5 py-3 bg-[#0c202b] rounded text-white font-semibold text-sm xl:text-base hover:bg-[#0c202b]/90"
          >
            Back to Chat
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-md text-[#0c202b] hover:bg-gray-100 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg"
          >
            <nav className="flex flex-col px-6 py-4 gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-[#0c202b] py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 pb-2">
                <Button 
                  onClick={() => { onBookDemo(); setMobileMenuOpen(false); }}
                  className="w-full px-5 py-3 bg-[#0c202b] rounded text-white font-semibold text-base hover:bg-[#0c202b]/90"
                >
                  Back to Chat
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;