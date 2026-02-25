import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import spectrumAiLogo from "@/assets/xpectrumai.png";
import aiIcon from "@/assets/AI Icon.jpg";
import automationIcon from "@/assets/automation icon.jpg";
import dataTransformationIcon from "@/assets/Data Transformation Icon.png";
import deliverIcon from "@/assets/Deliver.jpeg";

const Index = () => {
  // Check if this is an initial visit (no hash) or navigation (with hash)
  const isInitialVisit = !window.location.hash;
  const [isChatOpen, setIsChatOpen] = useState(isInitialVisit); // Only open chat on initial visit
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  // Handle card click to toggle flip
  const handleCardClick = (cardIndex: number) => {
    setFlippedCards(prev => {
      const newFlipped = new Set(prev);
      if (newFlipped.has(cardIndex)) {
        newFlipped.delete(cardIndex);
      } else {
        newFlipped.add(cardIndex);
      }
      return newFlipped;
    });
  };

  // Handle hash changes to control chat visibility
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#home') {
        setIsChatOpen(false); // Close chat when navigating to home
        setFlippedCards(new Set()); // Reset all cards to unflipped state
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Check initial hash
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return (
    <div className="bg-white w-full min-h-screen">
      <div className="bg-white w-full max-w-[1600px] mx-auto relative overflow-hidden">

        {/* Header */}
        <Header onBookDemo={() => setIsChatOpen(true)} />

        {/* Hero Section */}
        <section id="home" className="relative w-full min-h-screen flex items-center justify-center pt-24 sm:pt-32 overflow-hidden">
          {/* Background gradients - Desktop */}
          <div className="absolute w-[1219px] h-[677px] top-[210px] right-0 hidden lg:block">
            <div className="relative h-[677px]">
              <div className="absolute w-[516px] h-[518px] top-[110px] left-[703px] bg-[#efe9c0] rounded-[258px/259px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-0 left-[279px] bg-[#d0a4ff] rounded-[307px/308px] blur-[138px]" />
              <div className="absolute w-[614px] h-[616px] top-[61px] left-0 bg-[#c0e9ef] rounded-[307px/308px] blur-[138px]" />
            </div>
          </div>
          {/* Background gradients - Mobile/Tablet */}
          <div className="absolute inset-0 overflow-hidden lg:hidden pointer-events-none">
            <div className="absolute -top-10 -right-16 w-[55vw] h-[55vw] max-w-[350px] max-h-[350px] bg-[#efe9c0] rounded-full blur-[80px] opacity-50" />
            <div className="absolute top-[30%] left-[15%] w-[50vw] h-[50vw] max-w-[320px] max-h-[320px] bg-[#d0a4ff] rounded-full blur-[80px] opacity-50" />
            <div className="absolute top-[40%] -left-10 w-[50vw] h-[50vw] max-w-[320px] max-h-[320px] bg-[#c0e9ef] rounded-full blur-[80px] opacity-50" />
          </div>

          {/* Hero Content */}
          <div className="flex flex-col w-full max-w-[869px] items-start gap-10 sm:gap-16 px-4 sm:px-6 lg:px-8">
            <h1 className="relative self-stretch font-normal text-black text-[36px] sm:text-[50px] md:text-[70px] lg:text-[90px] tracking-[0] leading-[40px] sm:leading-[55px] md:leading-[75px] lg:leading-[90px] font-serif">
              <span className="font-semibold">Let innovative technologies work for you.</span>
            </h1>

            <div className="inline-flex items-center gap-[30px] relative flex-[0_0_auto] flex-col sm:flex-row">
              <Button 
                onClick={() => setIsChatOpen(true)}
                className="px-7 py-[15px] bg-[#0c202b] inline-flex items-center justify-center gap-2.5 rounded text-white font-semibold text-[15px] hover:bg-[#0c202b]/90"
              >
                <span className="text-xl">»</span>
                GET STARTED
              </Button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start gap-8 sm:gap-12 lg:gap-16 max-w-6xl mx-auto">
            <div className="flex flex-col w-full lg:w-1/2">
              <div className="flex items-center mb-6 sm:mb-8">
                <span className="text-sm sm:text-base font-semibold tracking-[4px] sm:tracking-[6.40px] text-[#9e9e9e] uppercase">ABOUT</span>
                <div className="flex-1 ml-4">
                  <div className="h-0.5 bg-gradient-to-r from-[#c0e9ef] to-[#d0a4ff]"></div>
                </div>
              </div>
              <h2 className="font-normal text-black text-2xl lg:text-3xl tracking-[0] leading-tight mb-6 font-serif">
                Our mission is to let innovative technologies work for businesses{" "}
                <span className="italic">by solving their core IT processing challenges.</span>
              </h2>
            </div>
            
            <div className="flex flex-col w-full lg:w-1/2 gap-6">
              <p className="font-normal text-black text-lg tracking-[0] leading-[28.8px]">
                We incorporate our four-step process and utilize technologies that enable businesses to
                focus on what truly matters. Our four main areas of focus:
              </p>
              <ul className="font-normal text-black text-lg tracking-[0] leading-[28.8px] list-disc list-inside space-y-2">
                <li>General IT Consulting</li>
                <li>Agentic AI Solutions</li>
                <li>Automation Solutions</li>
                <li>Data Transformation Solutions</li>
              </ul>
              <Button 
                variant="outline"
                onClick={() => navigate('/about')}
                className="px-7 py-[15px] border border-solid border-[#0c202b] inline-flex items-center justify-center gap-2.5 rounded font-semibold text-[#0c202b] text-[15px] hover:bg-[#0c202b]/5 w-fit"
              >
                <span className="text-xl">»</span>
                MORE ABOUT US
              </Button>
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <p className="font-semibold text-[#9e9e9e] tracking-[4px] sm:tracking-[6.40px] leading-4 text-xs sm:text-sm mb-4">SOLUTIONS</p>
              <h2 className="font-normal text-black text-3xl md:text-4xl lg:text-5xl tracking-[0] leading-tight font-serif">
                <span className="font-semibold">Our Areas of Practice</span>
              </h2>
            </div>

            {/* Services Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {/* General IT Consulting */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                onClick={() => handleCardClick(1)}
                className="relative w-full h-[348px] cursor-pointer group perspective-1000"
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="relative w-full h-full preserve-3d"
                  animate={{ rotateY: flippedCards.has(1) ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  {/* Front of card */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#fbfbfb] to-[#f7efff] rounded-lg p-8 flex flex-col transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-[#d0a4ff]/30 hover:bg-gradient-to-br hover:from-[#f0f0f0] hover:to-[#e8d5ff] hover:-translate-y-1 backface-hidden">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-8 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3">
                      <img
                        className="w-10 h-10"
                        alt="Icon"
                        src={deliverIcon}
                      />
                    </div>
                    <div className="font-semibold text-black text-2xl tracking-[-0.40px] leading-[28px] mb-6 transition-all duration-300 ease-in-out group-hover:text-[#0c202b] group-hover:translate-y-[-2px] text-center">
                      General IT Consulting
                    </div>
                    <div className="mt-auto text-center">
                      <div className="text-sm text-gray-500 font-medium">Click to learn more</div>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#f0f0f0] to-[#e8d5ff] rounded-lg p-8 flex flex-col justify-center backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                    <div className="font-semibold text-black text-2xl tracking-[-0.40px] leading-[28px] mb-6 text-center">
                      General IT Consulting
                    </div>
                    <div className="font-normal text-black text-base tracking-[0] leading-[24px] text-center">
                      We help businesses, entrepreneurs, or employees utilize unique hardware or software solutions to help drive efficiency and productivity.
                    </div>
                    <div className="mt-auto text-center">
                      <div className="text-sm text-gray-500 font-medium">Click to flip back</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Agentic AI Solutions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                onClick={() => handleCardClick(2)}
                className="relative w-full h-[348px] cursor-pointer group perspective-1000"
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="relative w-full h-full preserve-3d"
                  animate={{ rotateY: flippedCards.has(2) ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  {/* Front of card */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#fbfbfb] to-[#f7efff] rounded-lg p-8 flex flex-col transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-[#d0a4ff]/30 hover:bg-gradient-to-br hover:from-[#f0f0f0] hover:to-[#e8d5ff] hover:-translate-y-1 backface-hidden">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-8 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3">
                      <img
                        className="w-10 h-10"
                        alt="Icon"
                        src={aiIcon}
                      />
                    </div>
                    <div className="font-semibold text-black text-2xl tracking-[-0.40px] leading-[28px] mb-6 transition-all duration-300 ease-in-out group-hover:text-[#0c202b] group-hover:translate-y-[-2px] text-center">
                      Agentic AI Solutions
                    </div>
                    <div className="mt-auto text-center">
                      <div className="text-sm text-gray-500 font-medium">Click to learn more</div>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#f0f0f0] to-[#e8d5ff] rounded-lg p-8 flex flex-col justify-center backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                    <div className="font-semibold text-black text-2xl tracking-[-0.40px] leading-[28px] mb-6 text-center">
                      Agentic AI Solutions
                    </div>
                    <div className="font-normal text-black text-base tracking-[0] leading-[24px] text-center">
                      Our premier solution that incorporates a unique and custom AI experience that can execute tasks so that you don't have to.
                    </div>
                    <div className="mt-auto text-center">
                      <div className="text-sm text-gray-500 font-medium">Click to flip back</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Automation Solutions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onClick={() => handleCardClick(3)}
                className="relative w-full h-[348px] cursor-pointer group perspective-1000"
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="relative w-full h-full preserve-3d"
                  animate={{ rotateY: flippedCards.has(3) ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  {/* Front of card */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#fbfbfb] to-[#f7efff] rounded-lg p-8 flex flex-col transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-[#d0a4ff]/30 hover:bg-gradient-to-br hover:from-[#f0f0f0] hover:to-[#e8d5ff] hover:-translate-y-1 backface-hidden">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-8 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3">
                      <img
                        className="w-10 h-10"
                        alt="Icon"
                        src={automationIcon}
                      />
                    </div>
                    <div className="font-semibold text-black text-2xl tracking-[-0.40px] leading-[28px] mb-6 transition-all duration-300 ease-in-out group-hover:text-[#0c202b] group-hover:translate-y-[-2px] text-center">
                      Automation Solutions
                    </div>
                    <div className="mt-auto text-center">
                      <div className="text-sm text-gray-500 font-medium">Click to learn more</div>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#f0f0f0] to-[#e8d5ff] rounded-lg p-8 flex flex-col justify-center backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                    <div className="font-semibold text-black text-2xl tracking-[-0.40px] leading-[28px] mb-6 text-center">
                      Automation Solutions
                    </div>
                    <div className="font-normal text-black text-base tracking-[0] leading-[24px] text-center">
                      Our most cost effective solution. If you have a repetitious tasks, we can incorporate robotic processes to execute them for you.
                    </div>
                    <div className="mt-auto text-center">
                      <div className="text-sm text-gray-500 font-medium">Click to flip back</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Data Transformation Solutions */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                onClick={() => handleCardClick(4)}
                className="relative w-full h-[348px] cursor-pointer group perspective-1000"
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="relative w-full h-full preserve-3d"
                  animate={{ rotateY: flippedCards.has(4) ? 180 : 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  {/* Front of card */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#fbfbfb] to-[#f7efff] rounded-lg p-8 flex flex-col transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-2xl hover:shadow-[#d0a4ff]/30 hover:bg-gradient-to-br hover:from-[#f0f0f0] hover:to-[#e8d5ff] hover:-translate-y-1 backface-hidden">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-8 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-3">
                      <img
                        className="w-10 h-10"
                        alt="Icon"
                        src={dataTransformationIcon}
                      />
                    </div>
                    <div className="font-semibold text-black text-2xl tracking-[-0.40px] leading-[28px] mb-6 transition-all duration-300 ease-in-out group-hover:text-[#0c202b] group-hover:translate-y-[-2px] text-center">
                      Data Transformation Solutions
                    </div>
                    <div className="mt-auto text-center">
                      <div className="text-sm text-gray-500 font-medium">Click to learn more</div>
                    </div>
                  </div>

                  {/* Back of card */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#f0f0f0] to-[#e8d5ff] rounded-lg p-8 flex flex-col justify-center backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                    <div className="font-semibold text-black text-2xl tracking-[-0.40px] leading-[28px] mb-6 text-center">
                      Data Transformation Solutions
                    </div>
                    <div className="font-normal text-black text-base tracking-[0] leading-[24px] text-center">
                      The most productive way to consolidate data and bring analytics that matters.
                    </div>
                    <div className="mt-auto text-center">
                      <div className="text-sm text-gray-500 font-medium">Click to flip back</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Partners Section */}
        <section id="partners" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center mb-10 sm:mb-16">
              <span className="text-sm sm:text-base font-semibold tracking-[4px] sm:tracking-[6.40px] text-[#9e9e9e] uppercase">PARTNERS</span>
              <div className="flex-1 ml-4">
                <div className="h-0.5 bg-gradient-to-r from-[#c0e9ef] to-[#d0a4ff]"></div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="flex flex-col items-center text-center max-w-xs">
                <img
                  src={spectrumAiLogo}
                  alt="Spectrum AI"
                  className="h-16 mb-4 object-contain mix-blend-darken"
                />
                <p className="font-normal text-black text-lg tracking-[0] leading-[28.8px]">
                  we architect enterprise-grade agentic systems that handle complex business logic and scale across global operations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
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
            <h2 className="font-normal text-black text-3xl md:text-4xl lg:text-5xl tracking-[0] leading-tight font-serif mb-6">
              <span className="font-semibold">Let's innovate your business and change the way you work.</span>
            </h2>
            <p className="font-normal text-black text-lg text-center tracking-[0] leading-[28.8px] mb-8">
              Reach out to Hyun & Associates now.
            </p>
            <Button 
              onClick={() => window.open('https://outlook.office.com/bookwithme/user/719f78311287410ab589cb1be4871a00@hyunandassociatesllc.com?anonymous&ismsaljsauthenabled&ep=bwmEmailSignature', '_blank')}
              className="bg-[#0c202b] inline-flex items-center justify-center gap-2.5 rounded px-7 py-[15px] text-white font-semibold text-[15px] hover:bg-[#0c202b]/90"
            >
              📞 Schedule Now
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

export default Index;