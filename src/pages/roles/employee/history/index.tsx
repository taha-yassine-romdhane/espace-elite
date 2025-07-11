import EmployeeLayout from '../EmployeeLayout';

const HistoryPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold">Historique des Actions</h1>
            <p>Cette page est en cours de construction.</p>
        </div>
    );
};

HistoryPage.getLayout = (page: React.ReactNode) => (
    <EmployeeLayout>{page}</EmployeeLayout>
);

export default HistoryPage;
