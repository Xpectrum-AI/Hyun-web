import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import fullLogo from "@/assets/FullLogo_Transparent1.png";
import diagnoseIcon from "@/assets/Diagnose.jpeg";
import designIcon from "@/assets/Design.png";
import deliverIcon from "@/assets/Deliver.jpeg";
import hyunPhoto from "@/assets/hyunperson.jpg";

const AboutUs = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);


  return (
    <div className="bg-white w-full min-h-screen">
      <Header onBookDemo={() => setIsChatOpen(true)} />
      
      {/* Chat Interface */}
      <ChatInterface
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Main Content */}
      <div className="bg-white w-full max-w-[1600px] mx-auto relative overflow-hidden">
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
          <div className="absolute top-[25%] left-[10%] w-[50vw] h-[50vw] max-w-[320px] max-h-[320px] bg-[#d0a4ff] rounded-full blur-[80px] opacity-40" />
          <div className="absolute top-[35%] -left-10 w-[50vw] h-[50vw] max-w-[320px] max-h-[320px] bg-[#c0e9ef] rounded-full blur-[80px] opacity-40" />
        </div>

        {/* Hero Section */}
        <section className="relative w-full min-h-[70vh] sm:min-h-screen flex items-center justify-center pt-24 sm:pt-32">
          <div className="flex flex-col w-full max-w-[1200px] items-start gap-8 sm:gap-12 lg:gap-16 px-4 sm:px-6 lg:px-8">
            <h1 className="relative self-stretch font-semibold italic text-black text-[36px] sm:text-[50px] md:text-[70px] lg:text-[90px] tracking-[0] leading-[40px] sm:leading-[55px] md:leading-[75px] lg:leading-[90px] font-serif">
              <span className="font-bold">About </span>
              <span className="font-semibold italic">Us</span>
            </h1>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-8">
              <div className="w-24 sm:w-48 h-1 bg-gradient-to-r from-[#c0e9ef] to-[#d0a4ff]"></div>
              <h2 className="font-normal text-black text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-[0] leading-tight font-serif">
                <span className="font-semibold">We specialize in changing the way people work so that people don't have to work</span>
                <span className="font-semibold italic"> for technology. We leverage technology to work for people.</span>
              </h2>
            </div>

            <p className="font-normal text-black text-base sm:text-lg tracking-[0] leading-[26px] sm:leading-[28.8px] max-w-4xl">
              <span className="font-normal text-black text-base sm:text-lg tracking-[0] leading-[26px] sm:leading-[28.8px]">
                We go beyond surface-level fixes to create intelligent, scalable
                solutions that truly move the needle. By combining
              </span>
              <span className="font-bold">
                {" "}
                strategic insight with the power of AI and automation
              </span>
              <span className="font-normal text-black text-base sm:text-lg tracking-[0] leading-[26px] sm:leading-[28.8px]">
                , we help you optimize operations, improve customer experiences, and
                drive long-term growth.
              </span>
            </p>
          </div>
        </section>

        {/* 4-Step Process Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-10 sm:mb-16">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="w-24 sm:w-48 h-1 bg-gradient-to-r from-[#c0e9ef] to-[#d0a4ff]"></div>
                <h2 className="font-normal text-black text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-[0] leading-tight font-serif">
                  <span className="font-semibold">We have a 4 step process that guides people in their solution.</span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Step 1: Diagnose */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-red-100 rounded-lg">
                  <img
                    className="w-8 h-8 object-contain"
                    alt="Diagnose Icon"
                    src={diagnoseIcon}
                  />
                </div>
                <h3 className="font-medium text-black text-xl tracking-[-0.40px] leading-[22.0px] mb-4">
                  Step 1: Diagnose
                </h3>
                <p className="font-normal text-black text-sm tracking-[0] leading-[22.4px]">
                  We listen, ask questions and document every hiccup in your current processes.
                </p>
              </motion.div>

              {/* Step 2: Design */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-blue-100 rounded-lg">
                  <img
                    className="w-8 h-8 object-contain"
                    alt="Design Icon"
                    src={designIcon}
                  />
                </div>
                <h3 className="font-medium text-black text-xl tracking-[-0.40px] leading-[22.0px] mb-4">
                  Step 2: Design
                </h3>
                <p className="font-normal text-black text-sm tracking-[0] leading-[22.4px]">
                  Then we collaborate on scope, deliverables and pricing with our engineering team.
                </p>
              </motion.div>

              {/* Step 3: Deliver */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-green-100 rounded-lg">
                  <img
                    className="w-8 h-8 object-contain"
                    alt="Deliver Icon"
                    src={deliverIcon}
                  />
                </div>
                <h3 className="font-medium text-black text-xl tracking-[-0.40px] leading-[22.0px] mb-4">
                  Step 3: Deliver
                </h3>
                <p className="font-normal text-black text-sm tracking-[0] leading-[22.4px]">
                  Your tailored solution is developed, iterated and deployed with surgical precision.
                </p>
              </motion.div>

              {/* Step 4: Direct */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center bg-purple-100 rounded-lg">
                  <img
                    className="w-8 h-8 object-contain"
                    alt="Direct Icon"
                    src={designIcon}
                  />
                </div>
                <h3 className="font-medium text-black text-xl tracking-[-0.40px] leading-[22.0px] mb-4">
                  Step 4: Direct
                </h3>
                <p className="font-normal text-black text-sm tracking-[0] leading-[22.4px]">
                  Embed lasting change via training, best-practice playbooks and proactive support.
                </p>
              </motion.div>
            </div>
          </div>
        </section>


        {/* Leadership Section */}
        <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <img
                  className="w-full max-w-[400px] sm:max-w-[543px] h-auto aspect-[0.76] object-cover rounded-lg mx-auto lg:mx-0"
                  alt="Hyun Suh - CEO and President"
                  src={hyunPhoto}
                />
                <p className="mt-4 font-medium text-black text-lg sm:text-xl tracking-[-0.40px] leading-[22.0px] text-center lg:text-left">
                  Hyun Suh - CEO and President
                </p>
              </div>
              
              <div className="order-1 lg:order-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="w-24 sm:w-48 h-1 bg-gradient-to-r from-[#c0e9ef] to-[#d0a4ff]"></div>
                  <h2 className="font-normal text-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-[0] leading-tight font-serif">
                    <span className="font-semibold">Face Behind</span>
                    <br />
                    <span className="font-semibold italic">the Vision</span>
                  </h2>
                </div>
                
                <div className="font-normal text-black text-lg tracking-[0] leading-[28.8px] space-y-4">
                  <p>
                    <span className="font-normal text-black text-lg tracking-[0] leading-[28.8px]">
                      Hyun Suh brings over{" "}
                    </span>
                    <span className="font-semibold">eight years of sales expertise</span>
                    <span className="font-normal text-black text-lg tracking-[0] leading-[28.8px]">
                      —spanning commercial HVAC, financial services and funeral care—to his role as founder and CEO of Hyun & Associates. Four of those years were spent leading high-performing sales teams, where he earned top marks for{" "}
                    </span>
                    <span className="font-semibold">creative problem-solving</span>
                    <span className="font-normal text-black text-lg tracking-[0] leading-[28.8px]">
                      . Time and again, Hyun confronted siloed workflows and interdepartmental friction by deploying low-cost, high-impact technologies that unified teams and accelerated results.
                    </span>
                  </p>
                  
                  <p>
                    <span className="font-normal text-black text-lg tracking-[0] leading-[28.8px]">
                      Today, he guides organizations through a proven{" "}
                    </span>
                    <span className="font-semibold">4D framework—Diagnose, Design, Deliver, Direct</span>
                    <span className="font-normal text-black text-lg tracking-[0] leading-[28.8px]">
                      —to architect seamless, tech-driven workflows. His mission is to{" "}
                    </span>
                    <span className="font-semibold">spark disruption in the workplace</span>
                    <span className="font-normal text-black text-lg tracking-[0] leading-[28.8px]">
                      {" "}
                      by equipping employers and employees with cutting-edge tools and hands-on coaching, ensuring they not only adapt to change but thrive in it.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              <div className="col-span-1 sm:col-span-2">
                <div className="flex items-center gap-5 mb-6">
                  <img
                    src={fullLogo}
                    alt="Full Logo"
                    className="w-[120px] sm:w-[150px] h-auto aspect-[1.5] relative object-contain"
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-[#0c202b] text-base sm:text-lg mb-3 sm:mb-4">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link to="/" className="text-sm sm:text-base text-black hover:text-[#0c202b] transition-colors">Home</Link></li>
                  <li><Link to="/solutions" className="text-sm sm:text-base text-black hover:text-[#0c202b] transition-colors">Solutions</Link></li>
                  <li><Link to="/about" className="text-sm sm:text-base text-black hover:text-[#0c202b] transition-colors">About Us</Link></li>
                  <li><Link to="/partners" className="text-sm sm:text-base text-black hover:text-[#0c202b] transition-colors">Partners</Link></li>
                  <li><Link to="/contact" className="text-sm sm:text-base text-black hover:text-[#0c202b] transition-colors">Contact</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-[#0c202b] text-base sm:text-lg mb-3 sm:mb-4">Contact Info</h3>
                <div className="space-y-2 text-black text-sm sm:text-base">
                  <p className="break-all sm:break-normal">Email: Hyun@hyunandassociatesllc.com</p>
                  <p>Phone: 206-395-8503</p>
                  <p>Location: Seattle, WA</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
              <p className="text-black text-xs sm:text-sm">
                © 2024 Hyun and Associates LLC. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AboutUs;
