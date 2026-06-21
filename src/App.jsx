import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = "https://ai-debate-arena-production-e7da.up.railway.app";

// 🌟 Custom Cursor
function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 400, damping: 25 });
  const springY = useSpring(cursorY, { stiffness: 400, damping: 25 });
  const trailX = useSpring(cursorX, { stiffness: 80, damping: 20 });
  const trailY = useSpring(cursorY, { stiffness: 80, damping: 20 });

  useEffect(() => {
    const move = (e) => { cursorX.set(e.clientX); cursorY.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      <motion.div style={{
        position: "fixed", top: 0, left: 0, zIndex: 99999,
        width: 48, height: 48, borderRadius: "50%",
        border: "1px solid rgba(167,139,250,0.4)",
        x: trailX, y: trailY,
        translateX: "-50%", translateY: "-50%",
        pointerEvents: "none",
      }} />
      <motion.div style={{
        position: "fixed", top: 0, left: 0, zIndex: 99999,
        width: 8, height: 8, borderRadius: "50%",
        background: "#a78bfa",
        boxShadow: "0 0 15px #a78bfa, 0 0 30px #a78bfa44",
        x: springX, y: springY,
        translateX: "-50%", translateY: "-50%",
        pointerEvents: "none",
      }} />
    </>
  );
}

// 🕸️ Neural Network
function NeuralNetwork() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const nodes = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 1,
      pulse: Math.random() * Math.PI * 2,
    }));
    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach((n) => {
        n.x += n.vx; n.y += n.vy; n.pulse += 0.02;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        const dx = mouse.x - n.x; const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) { n.vx += dx * 0.00015; n.vy += dy * 0.00015; }
      });
      nodes.forEach((a, i) => {
        nodes.slice(i + 1).forEach((b) => {
          const dx = a.x - b.x; const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.15;
            const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            gradient.addColorStop(0, `rgba(167,139,250,${alpha})`);
            gradient.addColorStop(1, `rgba(103,232,249,${alpha})`);
            ctx.beginPath(); ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.5; ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        });
      });
      nodes.forEach((n) => {
        const glow = Math.sin(n.pulse) * 0.5 + 0.5;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + glow, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${0.15 + glow * 0.15})`;
        ctx.shadowBlur = 3; ctx.shadowColor = "#a78bfa"; ctx.fill();
      });
      requestAnimationFrame(animate);
    };
    animate();
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", width: "100%", height: "100%" }} />;
}

// 💥 Shatter Intro
function ShatterIntro({ onComplete }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animRef = useRef(null);
  const explodedRef = useRef(false);
  const clickRef = useRef(null);
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${window.innerWidth < 600 ? 38 : 68}px 'Georgia', serif`;
    ctx.textAlign = "center";
    ctx.fillText("AI DEBATE", canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText("ARENA", canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillRect(canvas.width / 2 - 60, canvas.height / 2 + 85, 120, 1);
    ctx.fillStyle = "#444"; ctx.font = "11px Georgia";
    ctx.fillText("CLICK TO ENTER", canvas.width / 2, canvas.height / 2 + 112);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const particles = [];
    for (let y = 0; y < canvas.height; y += 3) {
      for (let x = 0; x < canvas.width; x += 3) {
        const i = (y * canvas.width + x) * 4;
        if (imageData.data[i + 3] > 100) {
          particles.push({
            x, y, originX: x, originY: y,
            vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 1.5 + 0.5,
            color: `rgba(255,255,255,${Math.random() * 0.5 + 0.5})`,
            exploding: false, opacity: 1,
          });
        }
      }
    }
    particlesRef.current = particles;
    const handleClick = () => {
      if (explodedRef.current) return;
      explodedRef.current = true; setHint(false);
      particles.forEach((p) => {
        p.exploding = true;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 25 + 8;
        p.vx = Math.cos(angle) * speed; p.vy = Math.sin(angle) * speed - 5; p.opacity = 1;
      });
    };
    clickRef.current = handleClick;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;
      particles.forEach((p) => {
        if (p.exploding) {
          p.vx += (Math.random() - 0.5) * 0.5; p.vy += 0.15;
          p.x += p.vx; p.y += p.vy; p.opacity -= 0.012;
          if (p.opacity > 0) allDone = false;
        } else {
          p.vx += (p.originX - p.x) * 0.05; p.vy += (p.originY - p.y) * 0.05;
          p.vx *= 0.85; p.vy *= 0.85; p.x += p.vx; p.y += p.vy; allDone = false;
        }
        if (p.opacity > 0) {
          ctx.globalAlpha = p.opacity; ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color; ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      if (explodedRef.current && allDone) { onComplete(); return; }
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#050508", zIndex: 10, cursor: "none" }}
      onClick={() => clickRef.current && clickRef.current()}>
      <NeuralNetwork />
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {hint && (
        <motion.div animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }}
          style={{ position: "absolute", bottom: "3rem", left: "50%", transform: "translateX(-50%)", color: "#333", fontSize: "10px", letterSpacing: "6px", pointerEvents: "none", fontFamily: "Georgia, serif" }}>
          CLICK ANYWHERE TO ENTER
        </motion.div>
      )}
    </div>
  );
}

// 🔵 AI Avatar
function AIAvatar({ color, glowColor, label, side, active }) {
  const rings = [1.4, 1.7, 2.1];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
      <div style={{ position: "relative", width: "140px", height: "140px" }}>
        {rings.map((scale, i) => (
          <motion.div key={i}
            animate={{ rotate: 360 * (i % 2 === 0 ? 1 : -1) }}
            transition={{ duration: 4 + i * 2, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute", top: "50%", left: "50%",
              width: `${scale * 100}%`, height: `${scale * 40}%`,
              transform: `translate(-50%, -50%) rotateX(${60 + i * 10}deg)`,
              border: `1px solid ${glowColor}${i === 0 ? "88" : i === 1 ? "44" : "22"}`,
              borderRadius: "50%",
            }} />
        ))}
        <motion.div
          animate={{
            boxShadow: active
              ? [`0 0 40px ${glowColor}`, `0 0 80px ${glowColor}`, `0 0 40px ${glowColor}`]
              : [`0 0 20px ${glowColor}88`, `0 0 50px ${glowColor}66`, `0 0 20px ${glowColor}88`],
            scale: active ? [1, 1.08, 1] : [1, 1.03, 1],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90px", height: "90px", borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, #fff 0%, ${color} 50%, ${glowColor} 100%)`,
          }} />
        {[0, 60, 120, 180, 240, 300].map((deg, i) => (
          <motion.div key={i} animate={{ rotate: 360 }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", top: "50%", left: "50%", width: "100%", height: "100%", transform: `translate(-50%, -50%) rotate(${deg}deg)` }}>
            <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
              style={{ position: "absolute", top: "-4px", left: "50%", width: "4px", height: "4px", borderRadius: "50%", background: glowColor, boxShadow: `0 0 6px ${glowColor}` }} />
          </motion.div>
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "11px", letterSpacing: "4px", color: glowColor, fontFamily: "Georgia, serif", textTransform: "uppercase", margin: "0 0 4px", textShadow: `0 0 10px ${glowColor}` }}>{label}</p>
        <p style={{ fontSize: "9px", letterSpacing: "2px", color: "#333", margin: 0 }}>{side === "left" ? "PROPONENT" : "OPPONENT"}</p>
      </div>
    </div>
  );
}

// 🌊 Waveform
function Waveform({ active, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "30px" }}>
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div key={i}
          animate={active ? { height: [`${Math.random() * 20 + 5}px`, `${Math.random() * 25 + 8}px`, `${Math.random() * 15 + 5}px`] } : { height: "3px" }}
          transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity }}
          style={{ width: "3px", background: color, borderRadius: "2px", minHeight: "3px" }} />
      ))}
    </div>
  );
}

// ✅ Fact Check Badge
function FactCheckBadge({ result }) {
  if (!result) return null;
  const isSupported = result.includes("SUPPORTED") && !result.includes("UNSUPPORTED");
  const isPartial = result.includes("PARTIALLY");
  const color = isPartial ? "#ffd700" : isSupported ? "#4ade80" : "#ff6584";
  const label = isPartial ? "⚠️ PARTIAL" : isSupported ? "✅ VERIFIED" : "❌ UNVERIFIED";
  return (
    <div style={{
      display: "inline-block", padding: "3px 10px", borderRadius: "20px",
      border: `0.5px solid ${color}44`, background: `${color}11`,
      fontSize: "9px", letterSpacing: "2px", color, marginTop: "8px"
    }}>
      {label}
    </div>
  );
}

// 📄 PDF Upload
function PDFUpload({ onUpload, uploaded }) {
  const [uploading, setUploading] = useState(false);
  const [filename, setFilename] = useState("");
  const [chunks, setChunks] = useState(0);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await axios.post(`${API}/upload-pdf`, formData);
      setFilename(file.name);
      setChunks(res.data.chunks);
      onUpload(true);
    } catch (err) {
      console.error("PDF upload error:", err);
    }
    setUploading(false);
  };

  if (uploaded) {
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(74,222,128,0.08)",
          border: "0.5px solid rgba(74,222,128,0.4)",
          borderRadius: "12px", padding: "1.5rem",
          backdropFilter: "blur(20px)", marginBottom: "1rem",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "9px", letterSpacing: "3px", color: "#4ade80", margin: "0 0 0.5rem", fontWeight: 500 }}>
              ✅ RAG KNOWLEDGE BASE LOADED
            </p>
            <p style={{ fontSize: "9px", letterSpacing: "2px", color: "#4ade80", margin: "0 0 0.75rem", opacity: 0.8 }}>
              🟢 Document Evidence Ready
            </p>
            <p style={{ fontSize: "10px", letterSpacing: "1px", color: "#4ade80", margin: 0 }}>
              📄 {filename}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "0.5px solid rgba(167,139,250,0.2)",
      borderRadius: "12px", padding: "1.5rem",
      backdropFilter: "blur(20px)", marginBottom: "1rem",
    }}>
      <p style={{ fontSize: "9px", letterSpacing: "4px", color: "#444", marginBottom: "1rem" }}>
        📄 UPLOAD RESEARCH DOCUMENT (OPTIONAL)
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <motion.button
          whileHover={{ borderColor: "#a78bfa", color: "#a78bfa" }}
          whileTap={{ scale: 0.97 }}
          onClick={() => fileRef.current.click()}
          disabled={uploading}
          style={{
            padding: "0.6rem 1.5rem",
            background: "transparent",
            border: "0.5px solid #222",
            borderRadius: "8px", color: "#555",
            fontSize: "10px", letterSpacing: "2px",
            cursor: "none", fontFamily: "Georgia, serif",
            transition: "all 0.3s",
          }}
        >
          {uploading ? "Processing..." : "Choose PDF"}
        </motion.button>
        <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} style={{ display: "none" }} />
      </div>
    </div>
  );
}

// 🏟️ Main Arena
function Arena() {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [showJudge, setShowJudge] = useState(false);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [useRag, setUseRag] = useState(false);

  // Web Speech API: speak with simple mood mapping (frontend fallback)
  const speakWithMood = (text, mood = "neutral") => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return resolve();
      try {
        window.speechSynthesis.cancel();
      } catch {}

      const utter = new SpeechSynthesisUtterance(text);
      const mapping = {
        assertive: { rate: 1.05, pitch: 1.02, volume: 1.0 },
        calm: { rate: 0.9, pitch: 0.9, volume: 0.95 },
        excited: { rate: 1.25, pitch: 1.2, volume: 1.0 },
        neutral: { rate: 1.0, pitch: 1.0, volume: 1.0 },
        alpha: { rate: 1.08, pitch: 1.05, volume: 1.0 },
        omega: { rate: 0.88, pitch: 0.92, volume: 0.95 },
      };
      const cfg = mapping[mood] || mapping.neutral;
      utter.rate = cfg.rate;
      utter.pitch = cfg.pitch;
      utter.volume = cfg.volume;

      // choose an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const en = voices.find((v) => v.lang && v.lang.startsWith("en"));
      if (en) utter.voice = en;

      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    });
  };

  const speakText = async (text) => {
    // keep existing backend call as a fallback (unchanged)
    try {
      const res = await axios.post(`${API}/speak`, { text: text });
      const audio = new Audio(`data:audio/mp3;base64,${res.data.audio}`);
      audio.play();
    } catch (err) {
      console.error(err);
      alert("Voice generation failed!");
    }
  };

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const titleX = useTransform(mouseX, [-1, 1], [-20, 20]);
  const titleY = useTransform(mouseY, [-1, 1], [-10, 10]);
  const springTitleX = useSpring(titleX, { stiffness: 50, damping: 20 });
  const springTitleY = useSpring(titleY, { stiffness: 50, damping: 20 });
  const orbLeftX = useTransform(mouseX, [-1, 1], [-35, 35]);
  const orbLeftY = useTransform(mouseY, [-1, 1], [-20, 20]);
  const orbRightX = useTransform(mouseX, [-1, 1], [35, -35]);
  const orbRightY = useTransform(mouseY, [-1, 1], [20, -20]);
  const springOrbLX = useSpring(orbLeftX, { stiffness: 60, damping: 20 });
  const springOrbLY = useSpring(orbLeftY, { stiffness: 60, damping: 20 });
  const springOrbRX = useSpring(orbRightX, { stiffness: 60, damping: 20 });
  const springOrbRY = useSpring(orbRightY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const handleMove = (e) => {
      mouseX.set((e.clientX / window.innerWidth) * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const startDebate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setResult(null); setCurrentRound(0); setShowJudge(false);
    try {
      const res = await axios.post(`${API}/debate`, {
        topic, num_rounds: 3, use_rag: useRag && pdfUploaded,
      });
      
    setResult(res.data);

    for (let i = 1; i <= res.data.rounds.length; i++) {
      setCurrentRound(i);
      await new Promise((r) => setTimeout(r, 1200));
    }

    await new Promise((r) => setTimeout(r, 400));
    setShowJudge(true);
    } catch {
      alert("Start backend first!");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050508", color: "#fff", fontFamily: "Georgia, serif", overflowX: "hidden", cursor: "none" }}>
      <NeuralNetwork />
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Top bar */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ borderBottom: "0.5px solid #ffffff08", padding: "1.5rem 3rem", display: "flex", justifyContent: "space-between", backdropFilter: "blur(10px)", background: "rgba(255,255,255,0.02)" }}>
          <span style={{ fontSize: "10px", letterSpacing: "4px", color: "#333" }}>AI DEBATE</span>
          <span style={{ fontSize: "10px", letterSpacing: "4px", color: "#333" }}>ARENA · 2026</span>
        </motion.div>

        {/* Hero */}
        <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
          <motion.div style={{ x: springTitleX, y: springTitleY }}>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ fontSize: "10px", letterSpacing: "8px", color: "#a78bfa", marginBottom: "1.5rem" }}>
              MULTI-AGENT RAG DEBATE SYSTEM
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}
              style={{
                fontSize: "clamp(3rem, 8vw, 7rem)", fontWeight: 300, letterSpacing: "12px",
                textTransform: "uppercase", margin: "0 0 1rem",
                background: "linear-gradient(135deg, #fff 0%, #a78bfa 50%, #67e8f9 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1,
              }}>
              AI Debate<br />Arena
            </motion.h1>
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.8, duration: 1 }}
              style={{ width: "100px", height: "0.5px", background: "linear-gradient(90deg, transparent, #a78bfa, transparent)", margin: "1.5rem auto" }} />
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              style={{ fontSize: "13px", letterSpacing: "4px", color: "#555", fontStyle: "italic" }}>
              Where Intelligence Battles Intelligence
            </motion.p>
          </motion.div>

          {/* Orbs */}
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            style={{ display: "flex", justifyContent: "center", gap: "8rem", margin: "4rem 0 3rem", alignItems: "center" }}>
            <motion.div style={{ x: springOrbLX, y: springOrbLY }}>
              <AIAvatar color="#a78bfa" glowColor="#7c3aed" label="AI Alpha" side="left" active={loading} />
            </motion.div>
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#333", marginBottom: "8px" }}>⚡</div>
              <div style={{ fontSize: "clamp(1.5rem, 3vw, 2.5rem)", fontWeight: 300, letterSpacing: "8px", color: "#1a1a1a" }}>VS</div>
              <div style={{ fontSize: "10px", letterSpacing: "4px", color: "#333", marginTop: "8px" }}>⚡</div>
            </motion.div>
            <motion.div style={{ x: springOrbRX, y: springOrbRY }}>
              <AIAvatar color="#67e8f9" glowColor="#0891b2" label="AI Omega" side="right" active={loading} />
            </motion.div>
          </motion.div>

          {/* Input Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
            style={{ width: "100%", maxWidth: "600px" }}>

            {/* PDF Upload */}
            <PDFUpload onUpload={setPdfUploaded} uploaded={pdfUploaded} />

            {/* RAG Toggle */}
            {pdfUploaded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", justifyContent: "center" }}>
                <span style={{ fontSize: "10px", letterSpacing: "2px", color: "#555" }}>USE DOCUMENT EVIDENCE</span>
                <div
                  onClick={() => setUseRag(!useRag)}
                  style={{
                    width: "44px", height: "24px", borderRadius: "12px", cursor: "none",
                    background: useRag ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.1)",
                    border: `0.5px solid ${useRag ? "#a78bfa" : "#333"}`,
                    position: "relative", transition: "all 0.3s",
                  }}>
                  <motion.div animate={{ x: useRag ? 20 : 2 }}
                    style={{ position: "absolute", top: "2px", width: "20px", height: "20px", borderRadius: "50%", background: useRag ? "#a78bfa" : "#555" }} />
                </div>
                {useRag && <span style={{ fontSize: "9px", color: "#4ade80", letterSpacing: "2px" }}>✅ RAG ON</span>}
              </motion.div>
            )}

            {/* Glass Input */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(167,139,250,0.2)", borderRadius: "16px", padding: "2rem", backdropFilter: "blur(20px)" }}>
              <p style={{ fontSize: "9px", letterSpacing: "4px", color: "#444", marginBottom: "1.5rem", textAlign: "center" }}>ENTER DEBATE TOPIC</p>
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startDebate()}
                placeholder="e.g. AI will replace humans..."
                style={{ width: "100%", padding: "1rem", background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "8px", color: "#fff", fontSize: "14px", fontFamily: "Georgia, serif", outline: "none", marginBottom: "1rem", letterSpacing: "1px", cursor: "none", boxSizing: "border-box" }} />
              <motion.button whileHover={{ background: "rgba(124,58,237,0.3)", borderColor: "#a78bfa", scale: 1.02 }}
                whileTap={{ scale: 0.97 }} onClick={startDebate} disabled={loading}
                style={{ width: "100%", padding: "1rem", background: loading ? "rgba(255,255,255,0.02)" : "rgba(124,58,237,0.15)", border: `0.5px solid ${loading ? "#1a1a1a" : "rgba(124,58,237,0.4)"}`, borderRadius: "8px", color: loading ? "#333" : "#a78bfa", fontSize: "10px", letterSpacing: "4px", fontFamily: "Georgia, serif", cursor: "none", textTransform: "uppercase", transition: "all 0.3s" }}>
                {loading ? "⚡ Intelligence Battling..." : useRag ? "Initialize RAG Debate ⚔️" : "Initialize Debate ⚔️"}
              </motion.button>
            </div>
          </motion.div>

          {/* Loading */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: "2rem", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1rem" }}>
                <Waveform active={true} color="#a78bfa" />
                <Waveform active={true} color="#67e8f9" />
              </div>
              <p style={{ fontSize: "9px", letterSpacing: "4px", color: "#333" }}>
                {useRag ? "RETRIEVING EVIDENCE & PROCESSING" : "PROCESSING INTELLIGENCE"}
              </p>
            </motion.div>
          )}
        </section>

        {/* Rounds */}
        {result && (
          <section style={{ padding: "2rem 5%", maxWidth: "1100px", margin: "0 auto" }}>
            <AnimatePresence>
              {result.rounds.slice(0, currentRound).map((round, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: "2rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ flex: 1, height: "0.5px", background: "linear-gradient(90deg, transparent, #a78bfa22)" }} />
                    <span style={{ fontSize: "9px", letterSpacing: "5px", color: "#2a2a2a" }}>ROUND {i + 1}</span>
                    <div style={{ flex: 1, height: "0.5px", background: "linear-gradient(90deg, #67e8f922, transparent)" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {/* FOR */}
                    <motion.div whileHover={{ borderColor: "rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.05)" }}
                      style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(167,139,250,0.15)", borderRadius: "16px", padding: "2rem", backdropFilter: "blur(20px)", transition: "all 0.4s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <p style={{ fontSize: "9px", letterSpacing: "3px", color: "#a78bfa", margin: 0 }}>AI ALPHA</p>
                        <Waveform active={false} color="#a78bfa" />
                      </div>
                      <p style={{ fontSize: "14px", lineHeight: "1.9", color: "#666", margin: 0 }}>{round.for}</p>
                      {result.fact_checks[i] && <FactCheckBadge result={result.fact_checks[i].for} />}
                      <motion.button
                        whileHover={{ borderColor: "#a78bfa", color: "#a78bfa" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => speakWithMood(round.for, "alpha")}
                        style={{
                          padding: "0.6rem 1.2rem",
                          background: "transparent",
                          border: "0.5px solid #a78bfa",
                          borderRadius: "8px",
                          color: "#a78bfa",
                          fontSize: "9px",
                          letterSpacing: "2px",
                          fontFamily: "Georgia, serif",
                          marginTop: "1rem",
                          cursor: "none",
                          transition: "all 0.3s"
                        }}
                      >
                        🔊 ALPHA
                      </motion.button>
                    </motion.div>
                    {/* AGAINST */}
                    <motion.div whileHover={{ borderColor: "rgba(103,232,249,0.4)", background: "rgba(103,232,249,0.05)" }}
                      style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(103,232,249,0.15)", borderRadius: "16px", padding: "2rem", backdropFilter: "blur(20px)", transition: "all 0.4s" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <p style={{ fontSize: "9px", letterSpacing: "3px", color: "#67e8f9", margin: 0 }}>AI OMEGA</p>
                        <Waveform active={false} color="#67e8f9" />
                      </div>
                      <p style={{ fontSize: "14px", lineHeight: "1.9", color: "#666", margin: 0 }}>{round.against}</p>
                      {result.fact_checks[i] && <FactCheckBadge result={result.fact_checks[i].against} />}
                      <motion.button
                        whileHover={{ borderColor: "#67e8f9", color: "#67e8f9" }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => speakWithMood(round.against, "omega")}
                        style={{
                          padding: "0.6rem 1.2rem",
                          background: "transparent",
                          border: "0.5px solid #67e8f9",
                          borderRadius: "8px",
                          color: "#67e8f9",
                          fontSize: "9px",
                          letterSpacing: "2px",
                          fontFamily: "Georgia, serif",
                          marginTop: "1rem",
                          cursor: "none",
                          transition: "all 0.3s"
                        }}
                      >
                        🔊 OMEGA
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </section>
        )}

        {/* Judge Verdict */}
        <AnimatePresence>
          {showJudge && result && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }}
              style={{ padding: "4rem 5%", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} style={{ marginBottom: "3rem" }}>
                <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto" }}>
                  {[1, 1.4, 1.8].map((scale, i) => (
                    <motion.div key={i} animate={{ rotate: 360 * (i % 2 === 0 ? 1 : -1), opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 3 + i * 2, repeat: Infinity }}
                      style={{ position: "absolute", top: "50%", left: "50%", width: `${scale * 100}%`, height: `${scale * 100}%`, transform: "translate(-50%, -50%)", border: `1px solid rgba(255,215,0,${0.4 - i * 0.1})`, borderRadius: "50%" }} />
                  ))}
                  <motion.div animate={{ boxShadow: ["0 0 30px #ffd700", "0 0 80px #ffd700", "0 0 30px #ffd700"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "60px", height: "60px", borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #fff, #ffd700)" }} />
                </div>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  style={{ fontSize: "9px", letterSpacing: "5px", color: "#ffd70088", marginTop: "1.5rem" }}>
                  JUDGE AI · VERDICT PROCESSING
                </motion.p>
              </motion.div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ flex: 1, height: "0.5px", background: "linear-gradient(90deg, transparent, #ffd70044)" }} />
                <span style={{ fontSize: "9px", letterSpacing: "4px", color: "#ffd70066" }}>FINAL VERDICT</span>
                <div style={{ flex: 1, height: "0.5px", background: "linear-gradient(90deg, #ffd70044, transparent)" }} />
              </div>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                style={{ background: "rgba(255,215,0,0.03)", border: "0.5px solid rgba(255,215,0,0.15)", borderRadius: "20px", padding: "3rem", backdropFilter: "blur(20px)", boxShadow: "0 0 60px rgba(255,215,0,0.05)", marginBottom: "2rem" }}>
                <p style={{ fontSize: "15px", lineHeight: "2", color: "#888", margin: "0 0 2rem" }}>{result.verdict}</p>
                <motion.button
  whileHover={{ borderColor: "#67e8f9", color: "#67e8f9" }}
  whileTap={{ scale: 0.97 }}
  onClick={() => speakWithMood(result.verdict, "calm")}
  style={{
    padding: "0.75rem 2rem",
    background: "transparent",
    border: "0.5px solid #67e8f9",
    borderRadius: "50px",
    color: "#67e8f9",
    fontSize: "10px",
    letterSpacing: "3px",
    fontFamily: "Georgia, serif",
    marginBottom: "1rem",
    marginRight: "1rem",
    cursor: "none"
  }}
>
  🔊 HEAR VERDICT
</motion.button>
                <motion.button whileHover={{ borderColor: "#ffd700", color: "#ffd700" }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setResult(null); setTopic(""); setCurrentRound(0); setShowJudge(false); }}
                  style={{ padding: "0.75rem 2.5rem", background: "transparent", border: "0.5px solid #333", borderRadius: "50px", color: "#444", fontSize: "9px", letterSpacing: "3px", cursor: "none", fontFamily: "Georgia, serif", textTransform: "uppercase", transition: "all 0.3s" }}>
                  New Debate
                </motion.button>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("intro");
  return (
    <>
      <CustomCursor />
      <AnimatePresence mode="wait">
        {phase === "intro" ? (
          <ShatterIntro key="intro" onComplete={() => setPhase("arena")} />
        ) : (
          <Arena key="arena" />
        )}
      </AnimatePresence>
    </>
  );
}