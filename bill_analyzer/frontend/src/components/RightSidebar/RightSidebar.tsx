/* Created by Metrum AI for Dell */
import "../../styles/RightSidebar.css";
import HardwareInfo from "../HardwareInfo/HardwareInfo";
import CpuPowerGauge from "../metrics/CpuPowerGauge.js";
import CpuUtilizationPieChart from "../metrics/CpuUtilizationPieChart.js";
import MemoryUtilizationPieChart from "../metrics/MemoryUtilizationPieChart.js";
import ServerPowerGauge from "../metrics/ServerPowerGauge.js";
import ThroughputLineChart from "../metrics/ThroughputLineChart.js";
import ThroughputPerUserLineChart from "../metrics/ThroughputPerUserLineChart.js";

const RightSidebar = () => {
  return (
    <div className="right-sidebar-container">
      <div className="card">
        <HardwareInfo />
      </div>
      <div className="card hw-info-card">
        <div className="card__detail">
          <div className="card-header">Model Name</div>
          <div className="hw-info-detail">Llama 3.2 3B</div>
        </div>
        <div className="card__detail">
          <div className="card-header">Inference Serving Backend</div>
          <div className="hw-info-detail">VLLM - 0.6.3</div>
        </div>
        <div className="card__detail">
          <div className="card-header">Precision</div>
          <div className="hw-info-detail">BF16</div>
        </div>
        <div className="card__detail">
          <div className="card-header">Replicas</div>
          <div className="hw-info-detail">2</div>
        </div>
      </div>

      <div className="grid-container">
        <div className="card">
          <h3 className="card-header">Throughput/User (tokens/sec)</h3>
          <ThroughputPerUserLineChart />
        </div>
        <div className="card">
          <h3 className="card-header">Overall Throughput (tokens/sec)</h3>
          <ThroughputLineChart />
        </div>

        <div className="card">
          <h3 className="card-header">CPU Utilization</h3>
          <CpuUtilizationPieChart />
        </div>
        <div className="card">
          <h3 className="card-header">Memory Utilization</h3>
          <MemoryUtilizationPieChart />
        </div>
        <div className="card">
          <h3 className="card-header">Server Power (W)</h3>
          <ServerPowerGauge />
        </div>
        <div className="card">
          <h3 className="card-header">CPU Power (W)</h3>
          <CpuPowerGauge />
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
