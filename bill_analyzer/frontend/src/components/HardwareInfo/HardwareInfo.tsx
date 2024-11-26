/* Created by Metrum AI for Dell */
import { motion, MotionStyle } from "framer-motion";
import gpuImg from "../../assets/img/gpu.png";
import procImg from "../../assets/img/proc.png";
import "../../styles/HardwareInfo.css";

const containerStyle: MotionStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  position: "relative",
  background: "transparent",
};

const imgContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-evenly",
  width: "100%",
};

const imgWithTextStyle: MotionStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const imgStyle = {
  width: "120px",
};

const imgStyleAMD = {
  width: "80px",
};

const plusSymbolStyle = {
  margin: "0 4px",
  fontSize: "24px",
  fontWeight: "bold",
  color: "#fff",
};

const HardwareInfo = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        height: "100%",
        justifyContent: "space-between",
      }}
    >
      {/* The container for the images */}
      <motion.div style={{ ...containerStyle, flex: 1 }}>
        <div style={imgContainerStyle}>
          <motion.div
            style={imgWithTextStyle}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img src={procImg} alt="DELL PROC" style={imgStyle} />
            <span className="hardware-text">Dell™ PowerEdge™ R7725</span>
          </motion.div>

          <span style={plusSymbolStyle}>+</span>
          <motion.div
            style={imgWithTextStyle}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img src={gpuImg} alt="NVIDIA GPU" style={imgStyleAMD} />
            <span className="hardware-text">AMD EPYC 9755</span>
          </motion.div>
        </div>
      </motion.div>

      {/* The table container */}
      <div>
        <table className="table">
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CPU Sockets Count</td>
              <td>2</td>
            </tr>
            <tr>
              <td>Total No. of Physical Cores</td>
              <td>256</td>
            </tr>
            <tr>
              <td>Total RAM Memory (GiB)</td>
              <td>1350</td>
            </tr>
            <tr>
              <td>Base Clock</td>
              <td>2.7 GHz</td>
            </tr>
            <tr>
              <td>Max. Boost Clock</td>
              <td>Up to 4.1 GHz</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HardwareInfo;
