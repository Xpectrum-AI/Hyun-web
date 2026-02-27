import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import spectrumAiLogo from "@/assets/xpectrumai.png";

const Contact = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Here you would typically send the form data to your backend
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ firstName: "", lastName: "", email: "", message: "" });
  };

  const contactInfo = [
    {
      id: 1,
      icon: "📞",
      label: "Call Us",
      value: "(206) 395-8503",
    },
    {
      id: 2,
      icon: "✉️",
      label: "Email Us",
      value: "hyun@hyunandassociatesllc.com",
    },
    {
      id: 3,
      icon: "📍",
      label: "Our Location",
      value: "Seattle, WA",
    },
  ];

  return (
    <div className="bg-white w-full min-h-screen">
      <div className="bg-white w-full max-w-[1600px] mx-auto relative overflow-hidden">
        {/* Header */}
        <Header onBookDemo={() => setIsChatOpen(true)} />

        {/* Hero Section */}
        <section className="relative w-full min-h-[70vh] sm:min-h-screen flex items-center justify-center pt-24 sm:pt-32 bg-white">
          {/* Hero Content */}
          <div className="flex flex-col w-full max-w-[1200px] items-start gap-8 sm:gap-12 lg:gap-16 px-4 sm:px-6 lg:px-8">
            <h1 className="relative self-stretch font-normal text-black text-[36px] sm:text-[50px] md:text-[70px] lg:text-[90px] tracking-[0] leading-[40px] sm:leading-[55px] md:leading-[75px] lg:leading-[90px] font-serif">
              <span className="font-bold italic">Contact Us</span>
            </h1>

            {/* Contact Info Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
              {contactInfo.map((info, index) => (
                <div key={info.id} className={`flex flex-col items-start ${index === 2 ? 'sm:col-span-2 md:col-span-1 md:ml-auto' : ''}`}>
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{info.icon}</div>
                  <div className="opacity-90 font-normal text-[#373737] text-sm sm:text-[15px] tracking-[0] leading-[24.0px] mb-1 sm:mb-2">
                    {info.label}
                  </div>
                  <div className="opacity-85 font-semibold text-black text-base sm:text-lg md:text-xl tracking-[0] leading-6 break-all sm:break-words">
                    {info.id === 1 ? (
                      <a href={`tel:${info.value.replace(/[^+\d]/g, '')}`} className="hover:underline">{info.value}</a>
                    ) : info.id === 2 ? (
                      <a href={`mailto:${info.value}`} className="hover:underline">{info.value}</a>
                    ) : (
                      info.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto">
            {/* Section Header */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
              <span className="font-semibold text-[#9e9e9e] text-sm sm:text-base tracking-[4px] sm:tracking-[6.40px] uppercase">
                MESSAGE US
              </span>
              <div className="flex-1 h-0.5 bg-gradient-to-r from-[#c0e9ef] to-[#d0a4ff]"></div>
            </div>

            <h2 className="font-normal text-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0] leading-tight font-serif mb-8 sm:mb-12">
              <span className="font-semibold">Say </span>
              <span className="font-semibold italic">Hi </span>
            </h2>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="font-normal text-gray-700 text-lg tracking-[0] leading-[27.9px]">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="h-[44px] bg-transparent border-0 border-b border-gray-300 rounded-none px-0 py-4 text-lg focus:border-[#0c202b] focus:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="font-normal text-gray-700 text-lg tracking-[0] leading-[27.9px]">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="h-[44px] bg-transparent border-0 border-b border-gray-300 rounded-none px-0 py-4 text-lg focus:border-[#0c202b] focus:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="font-normal text-gray-700 text-lg tracking-[0] leading-[27.9px]">
                  Email Address *
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="h-[45px] bg-transparent border-0 border-b border-gray-300 rounded-none px-0 py-4 text-lg focus:border-[#0c202b] focus:ring-0"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="font-normal text-gray-700 text-lg tracking-[0] leading-[27.9px]">
                  Type Your Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="min-h-[114px] bg-transparent border-0 border-b border-gray-300 rounded-none px-0 py-4 text-lg resize-none focus:border-[#0c202b] focus:ring-0"
                />
              </div>

              <Button
                type="submit"
                className="bg-[#0c202b] inline-flex items-center justify-center gap-2.5 rounded px-[26px] py-[15px] text-white font-semibold text-[15px] hover:bg-[#1a3a4a] transition-colors duration-200"
              >
                SUBMIT NOW
              </Button>
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 sm:mb-8 gap-3">
              <p className="opacity-55 font-medium text-[#292929] text-xs sm:text-sm tracking-[0] leading-[18.9px]">
                © 2025 Hyun And Associates Llc. All Rights Reserved.
              </p>

              <div className="inline-flex items-center justify-center gap-2">
                <div className="opacity-55 font-medium text-[#292929] text-xs sm:text-sm tracking-[0] leading-[normal]">
                  Powered by
                </div>
                <div className="w-[95.06px] h-[19.95px] bg-[#0c202b] rounded text-white text-xs flex items-center justify-center">
                  HYUN
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 sm:gap-8">
              <div className="flex items-center gap-4 sm:gap-6 md:gap-[45px] flex-wrap justify-center">
                <Link to="/" className="text-xs sm:text-[15px] font-medium text-[#0c202b] tracking-[0] leading-[normal] hover:opacity-70 transition-opacity">
                  HOME
                </Link>
                <Link to="/solutions" className="font-medium text-[#0c202b] text-xs sm:text-[15px] tracking-[0] leading-[normal] hover:opacity-70 transition-opacity">
                  SOLUTIONS
                </Link>
                <Link to="/about" className="font-medium text-[#0c202b] text-xs sm:text-[15px] tracking-[0] leading-[normal] hover:opacity-70 transition-opacity">
                  ABOUT US
                </Link>
                <Link to="/partners" className="font-medium text-[#0c202b] text-xs sm:text-[15px] tracking-[0] leading-[normal] hover:opacity-70 transition-opacity">
                  PARTNERS
                </Link>
                <Link to="/contact" className="font-medium text-[#0c202b] text-xs sm:text-[15px] tracking-[0] leading-[normal] hover:opacity-70 transition-opacity">
                  CONTACT
                </Link>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-[#c0e9ef] to-[#d0a4ff]" />
            </div>

            <div className="flex items-center justify-center mt-6 sm:mt-8 opacity-35">
              <img
                className="w-[180px] sm:w-[259.24px] h-auto aspect-[4.71] mix-blend-multiply"
                alt="Spectrum AI"
                src={spectrumAiLogo}
              />
            </div>
          </div>
        </footer>
      </div>

      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Contact;