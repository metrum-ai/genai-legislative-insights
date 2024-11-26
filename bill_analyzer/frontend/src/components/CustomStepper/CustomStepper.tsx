/* Created by Metrum AI for Dell */
import { keyframes } from "@emotion/react";
import {
  FactCheck,
  GroupAdd as GroupAddIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Step, StepLabel, Stepper } from "@mui/material";
import StepConnector, {
  stepConnectorClasses,
} from "@mui/material/StepConnector";
import { StepIconProps } from "@mui/material/StepIcon";
import { styled } from "@mui/material/styles";
import EnvironmentalIcon from "../../assets/svg/eco.svg";
import LawIcon from "../../assets/svg/law.svg";

const pulseOrange = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,152,0, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255,152,0, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,152,0, 0); }
`;

const ColorlibConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 22 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { backgroundColor: "#7AA809" },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { backgroundColor: "#7AA809" },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 10,
    border: 0,
    backgroundColor: "#eaeaf0",
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled("div")<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ ownerState }) => ({
  backgroundColor: "#ccc",
  zIndex: 1,
  color: "#fff",
  width: 50,
  height: 50,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  ...(ownerState.completed && {
    backgroundColor: "#7AA809",
  }),
  ...(ownerState.active &&
    !ownerState.completed && {
    backgroundColor: "#ffb74d",
    boxShadow: "0 0 0 0 rgba(255,152,0, 0.7)",
    animation: `${pulseOrange} 1.5s infinite`,
  }),
}));

// Add debugging to ensure the condition is correct
function ColorlibStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;

  const icons: { [index: string]: React.ReactElement } = {
    1: <SettingsIcon />,
    2: <img src={LawIcon} alt="Legal and Compliance" />,
    3: <GroupAddIcon />,
    4: <img src={EnvironmentalIcon} alt="Environmental Impact" />,
    5: <FactCheck />,
  };

  return (
    <ColorlibStepIconRoot
      ownerState={{ active, completed }}
      className={className}
    >
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

interface CustomStepperProps {
  steps: string[];
  activeStep: number;
  completedSteps: Set<number>;
}
const CustomStepper: React.FC<CustomStepperProps> = ({
  steps,
  activeStep,
  completedSteps,
}) => {
  return (
    <Stepper
      alternativeLabel
      connector={<ColorlibConnector />}
      activeStep={activeStep}
    >
      {steps.map((label, index) => (
        <Step key={label} completed={completedSteps.has(index)}>
          <StepLabel StepIconComponent={ColorlibStepIcon}>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

export default CustomStepper;
