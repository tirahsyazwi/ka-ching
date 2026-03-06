import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Send, Copy, Check, Info, Sparkles, Coins, Gift } from 'lucide-react';

interface LinkData {
  id: string;
  sender: string;
  amount: string | null;
  tng_url: string;
}

const KachingAnimation = () => {
  return (
    <div className="flex flex-col items-center justify-center p-12 overflow-hidden relative min-h-[300px]">
      {/* Background Glow */}
      <motion.div
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.3, 0.1] 
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-0 bg-[#FF6321] rounded-full blur-[100px]"
      />

      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Flying Coins Animation */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: (Math.random() - 0.5) * 400, 
              y: (Math.random() - 0.5) * 400,
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              x: 0, 
              y: 0,
              opacity: [0, 1, 0],
              scale: [0, 1, 0.5],
              rotate: 360
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <div className="w-8 h-8 bg-[#FFD700] rounded-full border-2 border-[#E5591D] flex items-center justify-center shadow-lg">
              <Coins className="w-4 h-4 text-[#E5591D]" />
            </div>
          </motion.div>
        ))}

        {/* Central Collecting Point / Burst */}
        <motion.div
          animate={{ 
            scale: [0.8, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="relative z-10 w-20 h-20 bg-[#FF6321] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[#FF6321]/40 border-4 border-white/20"
        >
          <Wallet className="w-10 h-10 text-white" />
          
          {/* Pulse Rings */}
          <motion.div
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 border-4 border-[#FF6321] rounded-[2rem]"
          />
        </motion.div>
      </div>

      <div className="mt-12 text-center relative z-10">
        <motion.h3
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xl font-black text-[#FF6321] tracking-[0.2em] uppercase mb-2"
        >
          Ka-ching!
        </motion.h3>
        <p className="text-[10px] font-bold text-[#1A1A1A]/40 uppercase tracking-widest">
          Mengumpul Duit Raya...
        </p>
      </div>

      {/* Floating Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`p-${i}`}
          animate={{ 
            y: [0, -100],
            x: (Math.random() - 0.5) * 100,
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{ 
            duration: Math.random() * 2 + 1, 
            repeat: Infinity, 
            delay: Math.random() * 2 
          }}
          className="absolute bottom-0 w-1 h-1 bg-[#FFD700] rounded-full"
          style={{ left: `${Math.random() * 100}%` }}
        />
      ))}
    </div>
  );
};

export default function App() {
  const [tngUrl, setTngUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [useGif, setUseGif] = useState(true);

  const requiredPrefix = "https://cdn.tngdigital.com.my/s/oauth2/index.html#/moneypacket?";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isValidTngUrl = tngUrl.startsWith(requiredPrefix) && 
                         (tngUrl.includes("packetId=") || tngUrl.includes("p=")) && 
                         (tngUrl.includes("packetId=") ? tngUrl.split("packetId=")[1]?.length > 5 : tngUrl.split("p=")[1]?.length > 5);

    if (!isValidTngUrl) {
      setError("Sila masukkan pautan TNG Money Packet yang sah (mesti mengandungi packetId).");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tng_url: tngUrl }),
      });
      const data = await response.json();
      if (data.id) {
        const baseUrl = `${window.location.origin}/g/${data.id}`;
        const fullUrl = useGif ? `${baseUrl}?hasGif=true` : baseUrl;
        setCreatedLink(fullUrl);
      } else {
        setError(data.error || "Gagal menjana pautan.");
      }
    } catch (error) {
      console.error('Error creating link:', error);
      setError("Ralat rangkaian. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdLink) {
      navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1A1A1A] font-sans selection:bg-[#FF6321] selection:text-white overflow-x-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#1A1A1A 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Decorative Sparkles */}
      <div className="fixed top-20 left-[10%] w-2 h-2 bg-[#FF6321] rounded-full animate-pulse opacity-20" />
      <div className="fixed top-40 right-[15%] w-3 h-3 bg-[#FF6321] rounded-full animate-bounce opacity-10" />
      <div className="fixed bottom-20 left-[20%] w-2 h-2 bg-[#FF6321] rounded-full animate-pulse opacity-20" />
      <div className="fixed bottom-40 right-[10%] w-4 h-4 bg-[#FF6321] rounded-full animate-bounce opacity-10" />

      <main className="relative max-w-2xl mx-auto px-6 py-12 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF6321] rounded-2xl mb-6 shadow-lg shadow-[#FF6321]/20">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Ka-ching Link
          </h1>
          <p className="text-lg text-[#1A1A1A]/60 max-w-md mx-auto">
            Jana pautan Duit Raya dengan pratonton media yang cantik.
          </p>
        </motion.div>

        {/* Live Animated Preview Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="text-center mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6321] bg-[#FF6321]/10 px-3 py-1 rounded-full">
              Pratonton Live
            </span>
          </div>
          
          <div className="relative max-w-sm mx-auto group">
            {/* Social Media Card Simulation */}
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl shadow-black/10 border border-black/5 transition-transform duration-500 group-hover:scale-[1.02]">
              {/* Image Header */}
              <div className="relative h-48 bg-[#FF6321] overflow-hidden flex items-center justify-center">
                {/* Animated Background Elements */}
                <motion.div 
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '20px 20px' }}
                />
                
                {/* Floating Wallet Icon (Simulating the GIF) */}
                <motion.div
                  animate={{ 
                    y: [0, -15, 0],
                    rotateY: [0, 180, 360],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="relative z-10 w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20"
                >
                  <Wallet className="w-12 h-12 text-[#FF6321]" />
                </motion.div>

                {/* Sparkles */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 0.8, 0],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.3,
                      ease: "easeInOut" 
                    }}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    style={{ 
                      top: `${Math.random() * 80 + 10}%`, 
                      left: `${Math.random() * 80 + 10}%` 
                    }}
                  />
                ))}
              </div>

              {/* Content Area */}
              <div className="p-6 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Aktif Sekarang</span>
                </div>
                <h3 className="text-xl font-extrabold mb-2 tracking-tight">Duit Raya untuk anda! 🧧</h3>
                <p className="text-sm text-[#1A1A1A]/50 leading-relaxed">
                  Seseorang telah menghantar Duit Raya kepada anda! Klik untuk tuntut sekarang di Touch 'n Go eWallet.
                </p>
                
                <div className="mt-6 pt-6 border-t border-black/5 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#1A1A1A]/30 uppercase tracking-widest">kaching.asiss.my</span>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-[#F5F2ED] border-2 border-white" />
                    <div className="w-6 h-6 rounded-full bg-[#FF6321]/20 border-2 border-white" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Decorative Shadow/Glow */}
            <div className="absolute -inset-4 bg-[#FF6321]/5 blur-3xl -z-10 rounded-full" />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-xl shadow-black/5 border border-black/5"
            >
              <KachingAnimation />
            </motion.div>
          ) : !createdLink ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreate}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-black/5 border border-black/5"
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]/40 mb-2 ml-1">
                    Pautan TNG eWallet (Money Packet)
                  </label>
                  <input
                    required
                    type="url"
                    value={tngUrl}
                    onChange={(e) => {
                      setTngUrl(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="https://cdn.tngdigital.com.my/s/oauth2/index.html#/moneypacket?..."
                    className={`w-full px-4 py-3 rounded-xl bg-[#F5F2ED] border-2 transition-all outline-none ${error ? 'border-red-500' : 'border-transparent focus:border-[#FF6321]'}`}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-2 ml-1 font-medium">{error}</p>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F5F2ED] rounded-2xl border border-black/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      <Sparkles className={`w-5 h-5 ${useGif ? 'text-[#FF6321]' : 'text-[#1A1A1A]/20'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Gunakan GIF Animasi</p>
                      <p className="text-[10px] text-[#1A1A1A]/40">Paparan lebih meriah di media sosial</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseGif(!useGif)}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${useGif ? 'bg-[#FF6321]' : 'bg-[#1A1A1A]/10'}`}
                  >
                    <motion.div
                      animate={{ x: useGif ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-[#FF6321] text-white font-bold py-4 rounded-xl shadow-lg shadow-[#FF6321]/30 hover:bg-[#E5591D] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Jana Pautan Ka-ching
                  </button>
                </div>
              </div>

              <div className="mt-8 p-4 bg-[#F5F2ED] rounded-2xl flex gap-3 items-start">
                <Info className="w-5 h-5 text-[#FF6321] shrink-0 mt-0.5" />
                <p className="text-xs text-[#1A1A1A]/60 leading-relaxed">
                  Hanya pautan rasmi <strong>Touch 'n Go eWallet Money Packet</strong> diterima untuk menjamin keselamatan dan kesahihan.
                </p>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-black/5 border border-black/5 text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Pautan Berjaya Dijana!</h2>
              <p className="text-[#1A1A1A]/60 mb-8">Sedia untuk dikongsi kepada keluarga dan rakan-rakan.</p>

              <div className="bg-[#F5F2ED] p-4 rounded-2xl mb-8 break-all font-mono text-sm text-[#FF6321]">
                {createdLink}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  animate={copied ? { scale: [1, 1.05, 1] } : {}}
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white font-bold py-4 rounded-xl hover:bg-black transition-all"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Disalin!' : 'Salin Pautan'}
                </motion.button>
                <button
                  onClick={() => setCreatedLink(null)}
                  className="flex items-center justify-center gap-2 bg-[#F5F2ED] text-[#1A1A1A] font-bold py-4 rounded-xl hover:bg-[#EBE8E3] transition-all active:scale-[0.98]"
                >
                  Jana Baru
                </button>
              </div>

              <div className="mt-12 space-y-6 text-left">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#1A1A1A]/40 flex items-center gap-2">
                  <Send className="w-4 h-4" /> Tips Perkongsian
                </h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#FF6321]/10 text-[#FF6321] flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                    <p className="text-sm text-[#1A1A1A]/70">Tampal pautan di Threads atau WhatsApp.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#FF6321]/10 text-[#FF6321] flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                    <p className="text-sm text-[#1A1A1A]/70">Tunggu 3-5 saat sehingga kad pratinjau muncul secara automatik.</p>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-[#FF6321]/10 text-[#FF6321] flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                    <p className="text-sm text-[#1A1A1A]/70">Padam teks URL sebelum menghantar untuk paparan yang lebih bersih.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Decorative Elements */}
        <div className="mt-24 flex justify-center gap-12 opacity-20 grayscale">
          <Coins className="w-8 h-8" />
          <Gift className="w-8 h-8" />
          <Sparkles className="w-8 h-8" />
        </div>

        {/* Support Us Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-white/50 backdrop-blur-sm border border-black/5 rounded-3xl p-8 max-w-sm mx-auto">
            <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Sokong Projek Ini</h3>
            <p className="text-xs text-[#1A1A1A]/50 leading-relaxed mb-6">
              Jika Ka-ching Link membantu anda memeriahkan lagi suasana Raya, jemputlah belanja kami "kopi" untuk terus mengekalkan servis ini.
            </p>
            <button 
              onClick={() => setShowSupportModal(true)}
              className="inline-flex items-center gap-2 bg-[#1A1A1A] text-white text-xs font-bold px-6 py-3 rounded-xl hover:bg-black transition-all active:scale-95"
            >
              <Coins className="w-4 h-4 text-[#FFD700]" />
              Belanja Kopi
            </button>
            <p className="mt-4 text-[10px] text-[#1A1A1A]/30 italic">
              Terima kasih atas sokongan anda! Selamat Hari Raya! 🌙
            </p>
          </div>
        </motion.div>
      </main>

      {/* Support Modal */}
      <AnimatePresence>
        {showSupportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSupportModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setShowSupportModal(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F2ED] flex items-center justify-center hover:bg-[#EBE8E3] transition-colors"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#FF6321]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Coins className="w-8 h-8 text-[#FF6321]" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Terima Kasih!</h3>
                <p className="text-sm text-[#1A1A1A]/50 mb-8">
                  Sokongan anda amat bermakna bagi kami. Sila imbas kod QR di bawah untuk belanja kami kopi.
                </p>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="aspect-square bg-[#F5F2ED] rounded-2xl p-3 border border-black/5">
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TNG_EWALLET_QR_1" 
                        alt="TNG QR 1"
                        className="w-full h-full object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">TNG eWallet 1</p>
                  </div>
                  <div className="space-y-3">
                    <div className="aspect-square bg-[#F5F2ED] rounded-2xl p-3 border border-black/5">
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TNG_EWALLET_QR_2" 
                        alt="TNG QR 2"
                        className="w-full h-full object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">TNG eWallet 2</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowSupportModal(false)}
                  className="mt-10 w-full bg-[#F5F2ED] text-[#1A1A1A] font-bold py-4 rounded-xl hover:bg-[#EBE8E3] transition-all"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
