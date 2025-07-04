

export default async function google_recaptcha(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }
  
    const { recaptchaToken } = req.body;
    if (!recaptchaToken) {
      return res.status(400).json({ message: "Token not provided" });
    }
  
    const secretKey = "6LdxE-IqAAAAACbk-t-pbYMiR4qgqsRM24dFCtFK";
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
  
    try {
      const response = await fetch(verificationUrl, {
        method: "POST",
      });
      const data = await response.json();
  
      // For reCAPTCHA v3, check the score, e.g., threshold 0.5
      if (!data.success || data.score < 0.5) {
        return res.status(400).json({ message: "Captcha verification failed" });
      }
  
      return res.status(200).json({ message: "Captcha verified successfully", score: data.score });
    } catch (error) {
      console.error("Verification error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
  