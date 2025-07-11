import EmployeeLayout from '../EmployeeLayout';

const RentalsPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold">Gestion des Locations</h1>
            <p>Cette page est en cours de construction.</p>
        </div>
    );
};

RentalsPage.getLayout = (page: React.ReactNode) => (
    <EmployeeLayout>{page}</EmployeeLayout>
);

export default RentalsPage;
