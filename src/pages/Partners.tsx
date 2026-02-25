import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import spectrumAiLogo from "@/assets/xpectrumai.png";

const Partners = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="bg-white w-full min-h-screen">
      <div className="bg-white w-full max-w-[1600px] mx-auto relative overflow-hidden">
        {/* Header */}
        <Header onBookDemo={() => setIsChatOpen(true)} />

        {/* Hero Section */}
        <section className="relative w-full min-h-[70vh] sm:min-h-screen flex items-center justify-center pt-24 sm:pt-32 overflow-hidden">
          {/* Background gradients - Desktop */}
          <div className="absolute w-[1219px] h-[677px] top-[300px] right-0 opacity-50 hidden lg:block">
            <div className="relative h-[677px]">
              <div className="absolute w-[516px] h-[518px] top-[110px] left-[703px] bg-[#efe9c0] rounded-[258px/259px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-0 left-[279px] bg-[#d0a4ff] rounded-[307px/308px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-[61px] left-0 bg-[#c0e9ef] rounded-[307px/308px] blur-[138px]" />
            </div>
          </div>
          {/* Background gradients - Mobile/Tablet */}
          <div className="absolute inset-0 overflow-hidden lg:hidden pointer-events-none">
            <div className="absolute -top-10 -right-16 w-[55vw] h-[55vw] max-w-[350px] max-h-[350px] bg-[#efe9c0] rounded-full blur-[80px] opacity-40" />
            <div className="absolute top-[30%] left-[15%] w-[50vw] h-[50vw] max-w-[320px] max-h-[320px] bg-[#d0a4ff] rounded-full blur-[80px] opacity-40" />
            <div className="absolute top-[40%] -left-10 w-[50vw] h-[50vw] max-w-[320px] max-h-[320px] bg-[#c0e9ef] rounded-full blur-[80px] opacity-40" />
          </div>

          {/* Hero Content */}
          <div className="flex flex-col w-full max-w-[1200px] items-start gap-8 sm:gap-12 lg:gap-16 px-4 sm:px-6 lg:px-8">
            <h1 className="relative self-stretch font-semibold italic text-black text-[36px] sm:text-[50px] md:text-[70px] lg:text-[90px] tracking-[0] leading-[40px] sm:leading-[55px] md:leading-[75px] lg:leading-[90px] font-serif">
              Partners
            </h1>

            {/* Partners Content */}
            <div className="w-full max-w-[1000px]">
              {/* Partner 1 - Xpectrum AI */}
              <div className="flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <img
                    src={spectrumAiLogo}
                    alt="Xpectrum AI"
                    className="h-12 object-contain mix-blend-darken"
                  />
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-[#c0e9ef] to-[#d0a4ff]"></div>
                </div>

                {/* About Xpectrum AI Section */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="font-semibold text-black text-xl sm:text-2xl md:text-3xl tracking-[0] leading-tight mb-3 sm:mb-4 font-serif">
                    About Xpectrum AI
                  </h2>
                  <p className="font-normal text-black text-base sm:text-lg tracking-[0] leading-[26px] sm:leading-[28.8px] mb-3 sm:mb-4">
                    Xpectrum AI was founded with a bold vision: to tackle the increasingly complex and dynamic challenges that modern organizations face. As workplace demands escalate—driven by a surge in meetings, administrative tasks, and data overload—teams are stretched thin, and productivity suffers. Xpectrum AI addresses this head-on with Agentic AI solutions designed to act as intelligent virtual assistants that streamline operations and elevate both employee and customer experiences.
                  </p>
                  <p className="font-normal text-black text-base sm:text-lg tracking-[0] leading-[26px] sm:leading-[28.8px]">
                    Whether it's locating critical information across systems, automating sales processes, enhancing customer service, or sending personalized messages like a simple "Happy Birthday" to clients, Xpectrum's AI agents are built to handle it all—seamlessly and intelligently.
                  </p>
                </div>

                {/* The Team & Technology Section */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="font-semibold text-black text-xl sm:text-2xl md:text-3xl tracking-[0] leading-tight mb-3 sm:mb-4 font-serif">
                    The Team & Technology
                  </h2>
                  <p className="font-normal text-black text-base sm:text-lg tracking-[0] leading-[26px] sm:leading-[28.8px]">
                    With over five years of hands-on experience in the AI domain, co-founder Subhankar Ghosh has pioneered practical frameworks for deploying AI solutions that deliver measurable impact. Partnering with Jiayun Chen—a former lead engineer at Google with more than 15 years of experience—they've developed a suite of high-performance AI agents capable of executing tasks with precision and reliability.
                  </p>
                </div>

                {/* Tailored Solutions Section */}
                <div className="mb-6 sm:mb-8">
                  <h2 className="font-semibold text-black text-xl sm:text-2xl md:text-3xl tracking-[0] leading-tight mb-3 sm:mb-4 font-serif">
                    Tailored Solutions
                  </h2>
                  <p className="font-normal text-black text-base sm:text-lg tracking-[0] leading-[26px] sm:leading-[28.8px]">
                    Every solution they deliver is custom-built to align with your organization's unique workflows and goals. The agents undergo rigorous training and testing to ensure they perform with exceptional accuracy from day one—so you can implement with confidence and scale with ease.
                  </p>
                </div>

                <button 
                  onClick={() => window.open('https://xpectrum-ai.com/', '_blank')}
                  className="px-7 py-[15px] border border-solid border-[#0c202b] inline-flex items-center justify-center gap-2.5 rounded font-semibold text-[#0c202b] text-[15px] hover:bg-[#0c202b]/5 w-fit cursor-pointer transition-colors relative z-10"
                  style={{ pointerEvents: 'auto' }}
                >
                  <span className="text-xl">»</span>
                  VISIT WEBSITE
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background gradients - Desktop */}
          <div className="absolute w-[1223px] h-[541px] top-0 left-[189px] opacity-70 hidden lg:block">
            <div className="relative h-[541px]">
              <div className="absolute w-[516px] h-[518px] top-[23px] left-[707px] bg-[#efe9c0] rounded-[258px/259px] blur-[168px]" />
              <div className="absolute w-[522px] h-[523px] top-0 left-80 bg-[#d0a4ff] rounded-[261px/261.5px] blur-[168px]" />
              <div className="absolute w-[488px] h-[489px] top-[23px] left-0 bg-[#c0e9ef] rounded-[244px/244.5px] blur-[168px]" />
            </div>
          </div>
          {/* Background gradients - Mobile/Tablet */}
          <div className="absolute inset-0 overflow-hidden lg:hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] max-w-[300px] max-h-[300px] bg-[#efe9c0] rounded-full blur-[80px] opacity-50" />
            <div className="absolute top-[10%] left-[20%] w-[45vw] h-[45vw] max-w-[280px] max-h-[280px] bg-[#d0a4ff] rounded-full blur-[80px] opacity-50" />
            <div className="absolute bottom-0 -left-10 w-[45vw] h-[45vw] max-w-[280px] max-h-[280px] bg-[#c0e9ef] rounded-full blur-[80px] opacity-50" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="font-normal text-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0] leading-tight font-serif mb-4 sm:mb-6">
              <span className="font-semibold">Interested in partnering </span>
              <span className="font-semibold italic">with us?</span>
            </h2>
            <p className="font-normal text-black text-base sm:text-lg text-center tracking-[0] leading-[26px] sm:leading-[28.8px] mb-6 sm:mb-8">
              Let's create impactful solutions together.
            </p>
            <Button 
              onClick={() => window.open('https://outlook.office.com/bookwithme/user/719f78311287410ab589cb1be4871a00@hyunandassociatesllc.com?anonymous&ismsaljsauthenabled&ep=bwmEmailSignature', '_blank')}
              className="bg-[#0c202b] inline-flex items-center justify-center gap-2.5 rounded px-7 py-[15px] text-white font-semibold text-[15px] hover:bg-[#0c202b]/90"
            >
              Schedule Now
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 sm:mb-8 gap-3">
              <p className="opacity-55 font-medium text-black text-xs sm:text-sm tracking-[0] leading-[18.9px]">
                © 2025 Hyun And Associates Llc. All Rights Reserved.
              </p>

              <div className="inline-flex items-center justify-center gap-2">
                <div className="opacity-55 font-medium text-black text-xs sm:text-sm tracking-[0] leading-[normal]">
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

export default Partners;
