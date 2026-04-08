import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import spectrumAiLogo from "@/assets/xpectrumai.png";
import aiIcon from "@/assets/AI Icon.jpg";
import automationIcon from "@/assets/automation icon.jpg";
import dataTransformationIcon from "@/assets/Data Transformation Icon.png";
import deliverIcon from "@/assets/Deliver.jpeg";
import agenticAIPicture from "@/assets/Agentic AI Picture.jpg";
import automationPicture from "@/assets/Automation Picture.jpg";
import dataTransformationPicture from "@/assets/Data Transformation Pictuare.jpg";
import generalITPicture from "@/assets/General IT Picture.png";

const Solutions = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const solutionsData = [
    {
      id: 1,
      title: "General IT Consulting",
      description: "We help businesses, entrepreneurs, or employees utilize unique hardware or software solutions to help drive efficiency and productivity.",
      image: generalITPicture,
      iconBg: "#af71f1",
      cardBg: "#fbfbfb",
      border: "#af71f1",
      icon: deliverIcon,
      featured: true,
    },
    {
      id: 2,
      title: "Agentic AI Solutions",
      description: "Our premier solution that incorporates a unique and custom AI experience that can execute tasks so that you don't have to.",
      image: agenticAIPicture,
      iconBg: "#eff1ff",
      cardBg: "linear-gradient(152deg,rgba(251,251,251,1) 0%,rgba(247,239,255,1) 100%)",
      border: "transparent",
      icon: aiIcon,
    },
    {
      id: 3,
      title: "Automation Solutions",
      description: "Our most cost effective solution. If you have a repetitious tasks, we can incorporate robotic processes to execute them for you.",
      image: automationPicture,
      iconBg: "#ffefef",
      cardBg: "linear-gradient(152deg,rgba(251,251,251,1) 0%,rgba(247,239,255,1) 100%)",
      border: "transparent",
      icon: automationIcon,
    },
    {
      id: 4,
      title: "App Creation",
      description: "The most productive way to consolidate data and bring analytics that matters.",
      image: dataTransformationPicture,
      iconBg: "#eff1ff",
      cardBg: "linear-gradient(152deg,rgba(251,251,251,1) 0%,rgba(247,239,255,1) 100%)",
      border: "transparent",
      icon: dataTransformationIcon,
    },
  ];

  const handleCardClick = (id: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="page-bg w-full min-h-screen">
      <div className="w-full max-w-[1600px] mx-auto relative overflow-hidden">
        {/* Header */}
        <Header onBookDemo={() => setIsChatOpen(true)} />

        {/* Hero Section */}
        <section className="relative w-full min-h-[60vh] sm:min-h-[70vh] lg:min-h-screen flex items-center justify-center pt-16 sm:pt-24 lg:pt-32 overflow-hidden">
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
            <div className="absolute -top-10 -right-16 w-[70vw] h-[70vw] max-w-[450px] max-h-[450px] bg-[#efe9c0] rounded-full blur-[90px] opacity-60" />
            <div className="absolute top-[35%] left-[10%] w-[65vw] h-[65vw] max-w-[420px] max-h-[420px] bg-[#d0a4ff] rounded-full blur-[90px] opacity-60" />
            <div className="absolute top-[45%] -left-10 w-[65vw] h-[65vw] max-w-[420px] max-h-[420px] bg-[#c0e9ef] rounded-full blur-[90px] opacity-60" />
          </div>

          {/* Hero Content */}
          <div className="flex flex-col w-full max-w-[1200px] items-center lg:items-start gap-5 sm:gap-10 lg:gap-16 px-4 sm:px-6 lg:px-8 text-center lg:text-left">
            <h1 className="relative self-stretch font-semibold italic text-black text-[42px] sm:text-[56px] md:text-[70px] lg:text-[90px] tracking-[0] leading-[48px] sm:leading-[62px] md:leading-[75px] lg:leading-[90px] font-serif">
              Solutions
            </h1>

            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 mb-2 sm:mb-8">
              <div className="w-24 sm:w-48 h-1 bg-gradient-to-r from-[#c0e9ef] to-[#d0a4ff]"></div>
              <h2 className="font-normal text-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0] leading-snug font-serif">
                <span className="font-semibold">Our Areas of</span>
                <span className="font-semibold italic"> Practice</span>
              </h2>
            </div>
          </div>
        </section>

        {/* Solutions Grid Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background gradients - Desktop */}
          <div className="absolute w-[1219px] h-[677px] top-0 left-0 opacity-50 hidden lg:block">
            <div className="relative h-[677px]">
              <div className="absolute w-[516px] h-[518px] top-[110px] left-[703px] bg-[#efe9c0] rounded-[258px/259px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-0 left-[279px] bg-[#d0a4ff] rounded-[307px/308px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-[61px] left-0 bg-[#c0e9ef] rounded-[307px/308px] blur-[138px]" />
            </div>
          </div>
          {/* Background gradients - Mobile/Tablet */}
          <div className="absolute inset-0 overflow-hidden lg:hidden pointer-events-none">
            <div className="absolute top-[10%] -right-10 w-[60vw] h-[60vw] max-w-[400px] max-h-[400px] bg-[#efe9c0] rounded-full blur-[90px] opacity-60" />
            <div className="absolute top-[5%] left-[15%] w-[55vw] h-[55vw] max-w-[380px] max-h-[380px] bg-[#d0a4ff] rounded-full blur-[90px] opacity-60" />
            <div className="absolute top-[15%] -left-10 w-[55vw] h-[55vw] max-w-[380px] max-h-[380px] bg-[#c0e9ef] rounded-full blur-[90px] opacity-60" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Solutions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
              {solutionsData.map((solution, index) => (
                <motion.div
                  key={solution.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="w-full h-[300px] sm:h-[350px] relative"
                  style={{ perspective: '1200px' }}
                >
                  <div
                    className="w-full h-full rounded-2xl relative transition-all duration-500 ease-in-out cursor-pointer group"
                    style={{
                      transform: flippedCards.has(solution.id) ? 'rotateY(180deg)' : 'rotateY(0deg)',
                      transformStyle: 'preserve-3d',
                    }}
                    onClick={() => handleCardClick(solution.id)}
                  >
                    {/* Front of card */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-2xl border border-white/40 shadow-xl overflow-hidden transition-shadow duration-300 group-hover:shadow-2xl group-hover:shadow-[#d0a4ff]/15"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        background: 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                      }}
                    >
                      {solution.icon && (
                        <div
                          className="absolute w-11 h-11 top-6 sm:top-[34px] left-6 sm:left-[34px] rounded-xl flex items-center justify-center transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3 border border-white/50 shadow-sm"
                          style={{
                            background: 'rgba(255, 255, 255, 0.6)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                          }}
                        >
                          <img
                            className="w-6 h-6 transition-all duration-300 ease-in-out group-hover:brightness-110"
                            alt="Icon"
                            src={solution.icon}
                          />
                        </div>
                      )}

                      <div className="absolute top-[80px] sm:top-[108px] left-6 sm:left-[34px] right-6 sm:right-[34px]">
                        <h3 className="font-semibold text-[#1a1a2e] text-xl sm:text-2xl tracking-[-0.48px] leading-[24px] sm:leading-[26.4px] transition-all duration-300 ease-in-out group-hover:translate-y-[-2px]">
                          {solution.title}
                        </h3>
                      </div>

                      <img
                        className="absolute w-full h-[140px] sm:h-[180px] bottom-0 left-0 object-cover rounded-b-2xl transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:brightness-105"
                        alt="Solution"
                        src={solution.image}
                      />
                      {/* Subtle gradient overlay on image for blend */}
                      <div className="absolute bottom-0 left-0 w-full h-[60px] bg-gradient-to-t from-white/30 to-transparent rounded-b-2xl pointer-events-none" />
                    </div>

                    {/* Back of card */}
                    <div
                      className="absolute inset-0 w-full h-full rounded-2xl border border-white/40 shadow-xl p-6 sm:p-8 flex flex-col justify-center items-center text-center"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                      }}
                    >
                      <h3 className="font-semibold text-[#1a1a2e] text-xl sm:text-2xl tracking-[-0.48px] leading-[24px] sm:leading-[26.4px] mb-3 sm:mb-4">
                        {solution.title}
                      </h3>
                      <p className="text-[#3a3a4a] text-sm sm:text-[0.9rem] leading-relaxed">
                        {solution.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background gradients - Desktop */}
          <div className="absolute w-[1219px] h-[677px] top-0 left-0 opacity-50 hidden lg:block">
            <div className="relative h-[677px]">
              <div className="absolute w-[516px] h-[518px] top-[110px] left-[703px] bg-[#efe9c0] rounded-[258px/259px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-0 left-[279px] bg-[#d0a4ff] rounded-[307px/308px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-[61px] left-0 bg-[#c0e9ef] rounded-[307px/308px] blur-[138px]" />
            </div>
          </div>
          {/* Background gradients - Mobile/Tablet */}
          <div className="absolute inset-0 overflow-hidden lg:hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] max-w-[400px] max-h-[400px] bg-[#efe9c0] rounded-full blur-[90px] opacity-60" />
            <div className="absolute top-[10%] left-[15%] w-[55vw] h-[55vw] max-w-[380px] max-h-[380px] bg-[#d0a4ff] rounded-full blur-[90px] opacity-60" />
            <div className="absolute bottom-0 -left-10 w-[55vw] h-[55vw] max-w-[380px] max-h-[380px] bg-[#c0e9ef] rounded-full blur-[90px] opacity-60" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="font-normal text-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0] leading-tight font-serif mb-4 sm:mb-6">
              <span className="font-semibold">Ready to transform </span>
              <span className="font-semibold italic">your organization?</span>
            </h2>
            <p className="font-normal text-black text-base sm:text-lg text-center tracking-[0] leading-[26px] sm:leading-[28.8px] mb-6 sm:mb-8">
              Let's discuss how our solutions can help you achieve your goals.
            </p>
            <Button 
              onClick={() => setIsChatOpen(true)}
              className="bg-[#0c202b] inline-flex items-center justify-center gap-2.5 rounded px-7 py-[15px] text-white font-semibold text-[15px] hover:bg-[#0c202b]/90"
            >
              GET STARTED
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur-sm border-t border-gray-200">
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

export default Solutions;
