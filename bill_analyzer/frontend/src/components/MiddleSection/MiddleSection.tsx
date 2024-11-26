/* Created by Metrum AI for Dell */
/* eslint-disable react-hooks/exhaustive-deps */
import { GroupAdd as GroupAddIcon } from "@mui/icons-material";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useDispatch, useSelector } from "react-redux";
import { setJobs } from "../../actions/UserSlice";
import {
  useGetReplicaIdsQuery,
  useGetStatusQuery, useLazyGetOutputQuery, useStartRunsMutation
} from "../../app/api";
import ReportLogo from "../../assets/img/report-logo.png";
import EnvironmentalIcon from "../../assets/svg/eco.svg";
import LawIcon from "../../assets/svg/law.svg";
import "../../styles/MiddleSection.css";
import CustomStepper from "../CustomStepper/CustomStepper";

const VITE_REMOTE_IP = window.location.hostname;

const MiddleSection = () => {
  const reportSectionRef = useRef<HTMLDivElement | null>(null);

  const [reportData, setReportData] = useState("");
  const [getOutput] = useLazyGetOutputQuery();
  const [prevCompletedSteps, setPrevCompletedSteps] = useState(
    new Set<number>()
  );
  const stepNameToKey: { [key: string]: string } = {
    "Legal and Compliance Agent": "legal-1",
    "Social and Environmental Impact Agent": "social-1",
    "Economic and Budgetary Impact Agent": "economic-1",
  };
  const dispatch = useDispatch();
  const [numDocuments, setNumDocuments] = useState(1);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [startRuns] = useStartRunsMutation();

  const flowRunId = useSelector(
    (state: { user: { flowRunId: string } }) => state.user.flowRunId
  );
  const firstReplicaId = useSelector(
    (state: { user: { firstReplicaId: string } }) => state.user.firstReplicaId
  );

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set<number>());

  const steps = [
    "Preprocessing",
    "Legal and Compliance Agent",
    "Social and Environmental Impact Agent",
    "Economic and Budgetary Impact Agent",
    "Report Generation",
  ];

  const statusMapping = {
    "Preprocessing": "Preprocessing",
    "Legal and Compliance Agent": "Legal and Compliance Agent",
    "Social and Environmental Impact Agent":
      "Social and Environmental Impact Agent",
    "Economic and Budgetary Impact Agent":
      "Economic and Budgetary Impact Agent",
    "Report Generation": "Report Generation",
  };

  const { data: replicaIdsData, refetch } = useGetReplicaIdsQuery(flowRunId, {
    skip: !flowRunId,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleDownload = async () => {
    try {
      const response = await getOutput("report-1").unwrap();
      const data = response["report-1"]?.data;
      if (data) {
        // Convert Markdown to HTML
        const htmlContent = await marked(data);

        // Create a container element for the HTML content
        const container = document.createElement("div");
        container.innerHTML = htmlContent;
        container.style.position = "fixed";
        container.style.top = "-10000px";
        container.style.left = "-10000px";
        container.style.width = `${468 * (96 / 72)}px`; // Convert points to pixels
        container.style.padding = "20px";
        container.style.fontFamily = "Arial, sans-serif";
        container.style.fontSize = "12pt";
        document.body.appendChild(container);

        // Use html2canvas to capture the content as an image
        const canvas = await html2canvas(container, { scale: 2 });
        const imgWidth = 468; // Content width in points (US Legal minus margins)
        const pageHeight = 1008; // US Legal height in points
        const pageWidth = 612; // US Legal width in points
        const marginLeft = 72; // 1-inch margins (72 points)
        const marginTop = 72;
        const contentWidth = pageWidth - marginLeft * 2; // Adjusted content width
        const contentHeight = pageHeight - marginTop * 2; // Adjusted content height
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Create a new jsPDF instance with US Legal page size
        const pdf = new jsPDF("p", "pt", "legal");

        // Calculate the total number of pages
        const totalPages = Math.ceil(imgHeight / contentHeight);

        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }

          const srcY = i * contentHeight * (canvas.height / imgHeight);
          const srcHeight = contentHeight * (canvas.height / imgHeight);

          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = srcHeight;

          const ctx = pageCanvas.getContext("2d");
          if (!ctx) return;

          ctx.drawImage(
            canvas,
            0,
            srcY,
            canvas.width,
            srcHeight,
            0,
            0,
            canvas.width,
            srcHeight
          );

          const pageImgData = pageCanvas.toDataURL("image/png");

          pdf.addImage(
            pageImgData,
            "PNG",
            marginLeft,
            marginTop,
            contentWidth,
            contentHeight
          );
        }

        // Remove the container from the DOM
        document.body.removeChild(container);

        // Save the PDF
        pdf.save("legislativeReport.pdf");
      } else {
        console.warn("No data received for key report-1");
      }
    } catch (error) {
      console.error("Error fetching output for key report-1:", error);
    }
  };


  useEffect(() => {
    if (reportSectionRef.current) {
      reportSectionRef.current.scrollTo({
        top: reportSectionRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [reportData]);


  useEffect(() => {
    if (flowRunId) {
      const delayTimeout = setTimeout(() => {
        // Initial fetch before setting the interval
        if (!replicaIdsData || Object.keys(replicaIdsData).length === 0) {
          refetch();
        }

        // Start interval to check for data
        intervalRef.current = setInterval(() => {
          if (replicaIdsData && Object.keys(replicaIdsData).length > 0) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
          } else {
            refetch();
          }
        }, 2000);
      }, 2000);

      return () => {
        clearTimeout(delayTimeout);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [flowRunId, replicaIdsData, refetch]);

  const { data: statusData } = useGetStatusQuery(firstReplicaId, {
    skip: !firstReplicaId,
    pollingInterval: 5000,
  });

  useEffect(() => {
    if (statusData && typeof statusData === "object") {
      const completedStepNames = new Set(
        Object.keys(statusMapping).filter((key) =>
          Object.keys(statusData).some(
            (statusKey) =>
              statusKey.split("-")[0] === key &&
              statusData[statusKey] === "COMPLETED"
          )
        )
      );

      const updatedCompletedSteps = new Set<number>();
      steps.forEach((step, index) => {
        if (
          completedStepNames.has(
            statusMapping[step as keyof typeof statusMapping]
          )
        ) {
          updatedCompletedSteps.add(index);
        }
      });

      // Detect new completed steps
      const newCompletedStepsArray = [...updatedCompletedSteps].filter(
        (x) => !prevCompletedSteps.has(x)
      );

      // Fetch output for new completed steps
      newCompletedStepsArray.forEach((index) => {
        const stepName = steps[index];
        const key = stepNameToKey[stepName];

        if (key) {
          getOutput(key)
            .unwrap()
            .then((response) => {
              const data = response[key]?.data;
              if (data) {
                setReportData((prevData) => prevData + data);
              } else {
                console.warn(`No data received for key ${key}`);
              }
            })
            .catch((error) => {
              console.error(`Error fetching output for key ${key}:`, error);
            });
        } else {
          console.warn(`No key found for step: ${stepName}`);
        }
      });

      setCompletedSteps(updatedCompletedSteps);
      setPrevCompletedSteps(updatedCompletedSteps);

      // Find the next incomplete step
      const nextStepIndex = steps.findIndex(
        (_step, index) => !updatedCompletedSteps.has(index)
      );
      if (nextStepIndex !== -1) {
        setActiveStep(nextStepIndex);
      } else {
        // All steps are completed
        setActiveStep(-1);
      }
    }
  }, [statusData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setBillFile(file);
      } else {
        alert('Please upload only PDF files');
        e.target.value = ''; // Reset the input
      }
    }
  };

  const onSubmitJob = async () => {
    if (!billFile || flowRunId) {
      alert(
        flowRunId
          ? "Job already submitted"
          : "Please upload a legislative bill file."
      );
      return;
    }
    try {
      dispatch(setJobs(numDocuments));
      const result = await startRuns({
        bill: billFile,
        replicas: numDocuments,
      });
      if (result.data) {
        console.log("Flow Run ID:", result.data.flow_run_id);
      } else {
        alert("Failed to submit job. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting job:", error);
      alert("Error submitting job. Check console for details.");
    }
  };

  const isProcessOngoing = activeStep !== 0;

  return (
    <div className="middle-section-container">
      <div className="middle-section-card">
        <div className="card submit-job-container">
          <div className="card-header">Upload legislative bill</div>

          <div
            onClick={() => document.getElementById("file-upload")?.click()}
            className="upload-trigger secondary-button"
          >
            {billFile ? billFile.name : "Choose File"}
          </div>
          <input
            type="file"
            id="file-upload"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div className="card-header">Number of Documents</div>
          <div className="slider-input-container">
            <input
              type="range"
              min="0"
              max="100"
              value={numDocuments}
              onChange={(e) => {
                const newNumDocuments = Number(e.target.value);
                setNumDocuments(newNumDocuments);
                dispatch(setJobs(newNumDocuments));
              }}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={numDocuments}
              onChange={(e) => {
                const newNumDocuments = Number(e.target.value);
                setNumDocuments(newNumDocuments);
                dispatch(setJobs(newNumDocuments));
              }}
            />
          </div>
          <button className="primary-button" onClick={onSubmitJob}>
            Submit Job
          </button>
        </div>

        <div className="card stepper-card">
          <CustomStepper
            steps={steps}
            activeStep={activeStep}
            completedSteps={completedSteps}
          />
          {isProcessOngoing && (
            <div className="stepper-details-container active">
              {activeStep === 1 && (
                <div className="stepper-details">
                  <img
                    src={LawIcon}
                    alt="Legal and Compliance"
                    style={{
                      background: "#1976d2",
                      border: "1px solid #ccc",
                      borderRadius: "50%",
                      padding: "5px",
                    }}
                  />
                  <div className="step-desc">
                    <div className="step-desc-header">
                      Legal and Compliance Check ongoing
                    </div>
                    <div
                      className="step-desc-points"
                      title="Conduct a thorough analysis of the BILL to assess its constitutionality, potential conflicts with existing laws, and enforceability. Begin by evaluating whether the bill adheres to constitutional provisions and complies with national laws and rights, identifying any sections that might face constitutional challenges. Use relevant legal precedents or case law to support your findings. Next, determine if the bill conflicts with existing national or state laws, noting any duplication, contradictions, or gaps, and refer to past related legislation where applicable. Finally, assess the clarity of the bill’s key terms and evaluate the enforceability of its provisions to ensure they are reasonable, consistent with legal standards, and aligned with constitutional principles."
                    >
                      Conduct a thorough analysis of the BILL to assess its constitutionality, potential conflicts with existing laws, and enforceability. Begin by evaluating whether the bill adheres to constitutional provisions and complies with national laws and rights, identifying any sections that might face constitutional challenges.
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="stepper-details">
                  <GroupAddIcon
                    style={{
                      background: "#1976d2",
                      border: "1px solid #ccc",
                      borderRadius: "50%",
                      padding: "5px",
                      fontSize: "36px",
                    }}
                  />
                  <div className="step-desc">
                    <div className="step-desc-header">
                      Social and Environmental Impact Analysis ongoing
                    </div>
                    <div
                      className="step-desc-points"
                      title="Conduct a comprehensive analysis of the BILL, focusing on its impacts on vulnerable populations, environmental sustainability, and social services. Address how it may affect low-income families, minorities, or other marginalized groups, examining whether it addresses social equity or creates disparities. Evaluate the bill’s environmental impact, including any disproportionate effects on vulnerable groups, and consider its role in promoting sustainability, reducing pollution, or protecting natural resources. Finally, assess how the bill influences social services, such as healthcare, education, and welfare, and whether it enhances or restricts access to these resources for vulnerable populations."
                    > Conduct a comprehensive analysis of the BILL, focusing on its impacts on vulnerable populations, environmental sustainability, and social services. Address how it may affect low-income families, minorities, or other marginalized groups, examining whether it addresses social equity or creates disparities.
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="stepper-details">
                  <img
                    src={EnvironmentalIcon}
                    alt="Economic and Budgetary"
                    style={{
                      background: "#1976d2",
                      border: "1px solid #ccc",
                      borderRadius: "50%",
                      padding: "5px",
                    }}
                  />
                  <div className="step-desc">
                    <div className="step-desc-header">
                      Economic and Budgetary Impact Analysis ongoing
                    </div>
                    <div
                      className="step-desc-points"
                      title="Conduct a comprehensive analysis of the BILL to assess its impact on the budget, economic growth, and fiscal sustainability. Begin by estimating the cost of implementing the bill and evaluating its fiscal responsibility in light of the current national or state budget. Highlight any new revenue sources, increases in expenditures, or reallocations of existing funds. Then, analyze the potential effects on economic growth and employment, identifying sectors that may benefit or be adversely affected by the bill. Finally, assess the bill’s long-term fiscal sustainability, considering whether it will generate sufficient revenue or economic activity to offset its costs, and noting any potential long-term liabilities or risks to fiscal stability."
                    >
                      Conduct a comprehensive analysis of the BILL to assess its impact on the budget, economic growth, and fiscal sustainability. Begin by estimating the cost of implementing the bill and evaluating its fiscal responsibility in light of the current national or state budget.
                    </div>
                  </div>
                </div>
              )}
              <a
                href={`http://${VITE_REMOTE_IP}:8100/prefect/runs/flow-run/${flowRunId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="primary-button"
              >
                View Details
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="card report-section">
        {reportData ? (
          <>
            <div className="report-content" ref={reportSectionRef}>
              <ReactMarkdown>
                {reportData}
              </ReactMarkdown>
            </div>
            <button className="primary-button" onClick={handleDownload}>
              Download
            </button>
          </>
        ) : (
          <img src={ReportLogo} alt="report" className="report-logo" />
        )}
        <div className="card-header">
          Last report generated at &nbsp;
          <span className="report-date">
            {new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              hour12: true,
              hour: "numeric",
              minute: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MiddleSection;
