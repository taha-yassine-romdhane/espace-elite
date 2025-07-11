import EmployeeLayout from '../EmployeeLayout';

const NotificationsPage = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p>Cette page est en cours de construction.</p>
        </div>
    );
};

NotificationsPage.getLayout = (page: React.ReactNode) => (
    <EmployeeLayout>{page}</EmployeeLayout>
);

export default NotificationsPage;
