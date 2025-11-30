import { ImportDropzone } from "./import-dropzone";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";

type ImportModalProps = {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ImportModal({
	projectId,
	open,
	onOpenChange,
}: ImportModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Import OpenAPI Spec</DialogTitle>
					<DialogDescription>
						Import endpoints from an OpenAPI 3.x specification (JSON or YAML)
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<ImportDropzone
						projectId={projectId}
						variant="full"
						onSuccess={() => onOpenChange(false)}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}
