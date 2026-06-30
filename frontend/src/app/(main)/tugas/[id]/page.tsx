import { PageContainer } from "@/components/ui/page-container";
import TaskDetailPage from "@/components/tugas/TaskDetailPage";

export default function TaskPage({ params }: { params: { id: string } }) {
  return (
    <PageContainer>
      <TaskDetailPage defaultBackUrl="/tugas" />
    </PageContainer>
  );
}
