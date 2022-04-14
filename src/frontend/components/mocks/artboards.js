export default [
    {
        id: 1,
        name: 'App Icon',
        type: 'artboard',
        destinations: [
            {
                remote_path: 'A Folder',
                remote_id: '123',
                remote_project_id: 'PROJECT-123',
                state: 'modified',
                modified: '',
                upload: {
                    status: 'done',
                    progress: 100,
                },
            },
            {
                remote_path: 'A Folder',
                remote_id: '1234',
                remote_project_id: 'PROJECT-123',
                state: 'modified',
                modified: '',
                upload: {
                    status: 'done',
                    progress: 100,
                },
            },
        ],
    },
    {
        id: 2,
        name: 'App Icon',
        type: 'artboard',
        destinations: [],
    },
    {
        id: 3,
        name: 'App Icon 2',
        type: 'artboard',
        destinations: [
            {
                remote_path: 'A Folder',
                remote_id: '1234',
                remote_project_id: 'PROJECT-123',
                state: 'modified',
                upload: { status: 'uploading', progress: 12 },
            },
        ],
    },
    {
        id: 1,
        name: 'App Icon',
        type: 'artboard',
        destinations: [
            {
                remote_path: 'A Folder',
                remote_id: '1234',
                remote_project_id: 'PROJECT-123',
                state: 'modified',
                modified: '',
                upload: {
                    status: 'pending',
                    progress: 0,
                },
            },
        ],
    },
];
