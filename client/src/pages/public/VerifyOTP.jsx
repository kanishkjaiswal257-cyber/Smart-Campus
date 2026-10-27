import { useState } from "react";
import { useNavigate } from "react-router-dom";

function VerifyOTP() {
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!/^\d{6}$/.test(otp)) {
            setMessage("Please enter a valid 6-digit OTP.");
            return;
        }

        setMessage(
            "OTP verification is not connected to the backend yet."
        );
    };

    return (
        <div className="page-container">
            <div className="profile-card">
                <h1>Verify OTP</h1>
                <p>Enter the 6-digit verification code.</p>

                <form onSubmit={handleSubmit} className="upload-form">
                    <label htmlFor="otp">One-Time Password</label>

                    <input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) =>
                            setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                    />

                    <button type="submit" className="btn-primary">
                        Verify OTP
                    </button>

                    {message && <p role="status">{message}</p>}
                </form>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={() => navigate("/login")}
                >
                    Back to Login
                </button>
            </div>
        </div>
    );
}

export default VerifyOTP;