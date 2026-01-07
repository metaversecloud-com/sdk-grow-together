export const AppliedToolIcons = ({ appliedTools }: { appliedTools: string[] | undefined }) => {
  return (
    <div style={{ width: "30px" }}>
      {appliedTools?.map((toolName, index) => (
        <div key={index} className="tooltip mb-1 ">
          <span className="tooltip-content">{toolName}</span>
          <div className="p2 icon icon-sm">🌱</div>
        </div>
      ))}
    </div>
  );
};
