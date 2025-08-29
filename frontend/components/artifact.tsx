export interface UIArtifact {
  documentId: string;
  content: string;
  kind: string;
  title: string;
  status: string;
  isVisible: boolean;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export function Artifact({ artifact }: { artifact: UIArtifact }) {
  if (!artifact.isVisible) return null;

  return (
    <div
      className="artifact"
      style={{
        position: 'absolute',
        top: artifact.boundingBox.top,
        left: artifact.boundingBox.left,
        width: artifact.boundingBox.width,
        height: artifact.boundingBox.height,
      }}
    >
      <div className="artifact-content">
        {artifact.kind === 'text' ? (
          <pre>{artifact.content}</pre>
        ) : (
          <div>{artifact.content}</div>
        )}
      </div>
    </div>
  );
}
