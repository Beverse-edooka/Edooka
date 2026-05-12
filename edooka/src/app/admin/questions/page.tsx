/**
 * Page: AdminQuestions
 * Purpose: Basic CRUD module scaffold for exam questions.
 */
export default function AdminQuestionsPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Questions CRUD</h1>
      <div className="card-hover rounded-2xl border border-border-default bg-white p-4">
        <p className="font-semibold">Create / Edit question</p>
        <p className="text-sm text-text-secondary">
          Add form fields here: question text, options A-D, correct option, rationale.
        </p>
      </div>
      <div className="card-hover rounded-2xl border border-border-default bg-white p-4">
        <p className="font-semibold">Question list</p>
        <p className="text-sm text-text-secondary">
          This section will show table view with edit and delete actions.
        </p>
      </div>
    </section>
  );
}
