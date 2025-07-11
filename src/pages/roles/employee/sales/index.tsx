import EmployeeLayout from '../EmployeeLayout';

const SalesPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold">Gestion des Ventes</h1>
            <p>Cette page est en cours de construction.</p>
        </div>
    );
};

SalesPage.getLayout = (page: React.ReactNode) => (
    <EmployeeLayout>{page}</EmployeeLayout>
);

export default SalesPage;
