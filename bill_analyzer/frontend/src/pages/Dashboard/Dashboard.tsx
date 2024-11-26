/* Created by Metrum AI for Dell */
import MiddleSection from "../../components/MiddleSection/MiddleSection";
import RightSidebar from "../../components/RightSidebar/RightSidebar";
import "../../styles/Dashboard.css";

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <MiddleSection />
      <RightSidebar />
    </div>
  );
};

export default Dashboard;
