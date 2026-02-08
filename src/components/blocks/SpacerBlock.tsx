interface SpacerBlockData {
    height: number;
}

interface SpacerBlockProps {
    data: SpacerBlockData;
}

export default function SpacerBlock({ data }: SpacerBlockProps) {
    const { height = 60 } = data;

    return (
        <div
            className="spacer-block"
            style={{ height: `${height}px` }}
            aria-hidden="true"
        />
    );
}
