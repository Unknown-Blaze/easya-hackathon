// src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import styles from './UserProfile.module.css';
import { Link } from 'react-router-dom'; // <<<<<<<<<<<< IMPORT Link

const UserProfile = () => {
    const { currentUserProfile, updateUserProfile } = useAuth(); // Assuming updateUserProfile updates displayName in context & Firestore
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [formData, setFormData] = useState({ displayName: '' });
    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    useEffect(() => {
        if (currentUserProfile) {
            setFormData({
                displayName: currentUserProfile.displayName || ''
            });
        }
    }, [currentUserProfile]);

    useEffect(() => {
        const loadProjects = async () => {
            setLoadingProjects(true);
            try {
                // Assuming 'charity_projects' is the correct collection name
                // And each document in this collection has 'name' and 'description'
                const projectsRef = collection(db, 'charity_projects');
                // You might want to order them, e.g., by creation date if you have such a field
                // const q = query(projectsRef, orderBy("createdAt", "desc"));
                const q = query(projectsRef); // Simple query for all projects for now
                const querySnapshot = await getDocs(q);
                const projectsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProjects(projectsData);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoadingProjects(false);
            }
        };

        loadProjects();
    }, []); // Load projects once on component mount

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!currentUserProfile || !currentUserProfile.uid) {
            console.error("User profile or UID is missing.");
            return;
        }
        try {
            // Update in Firebase Auth (if your updateUserProfile in AuthContext handles this)
            // and Firestore.
            const userDocRef = doc(db, 'users', currentUserProfile.uid);
            await updateDoc(userDocRef, {
                displayName: formData.displayName,
            });
            // Also update the local AuthContext state
            if (updateUserProfile) { // Check if updateUserProfile is provided by useAuth
                await updateUserProfile(formData.displayName); // This should update currentUserProfile in context
            }
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            // Add user-facing error message if needed
        }
    };

    const handleCancel = () => {
        setFormData({
            displayName: currentUserProfile?.displayName || ''
        });
        setIsEditing(false);
    };

    const getShortAddress = (addr) => {
        if (!addr) return 'Not set';
        if (addr.length <= 12) return addr;
        return `${addr.slice(0, 6)}......${addr.slice(-6)}`;
    };

    return (
        <div className={styles.userProfileContainer}>
            <div className={styles.contentWrapper}>
                {/* Profile Information */}
                <div className={styles.profileSection}>
                    <div className={styles.titleContainer}>
                        <h3 className={styles.profileTitle}>Personal Information</h3>
                    </div>
                    {!isEditing ? (
                        <>
                            <div className={styles.profileInfo}>
                                <div className={styles.infoItem}>
                                    <strong className={styles.infoLabel}>Name:</strong>
                                    <span className={styles.infoValue}>{currentUserProfile?.displayName || 'Not set'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <strong className={styles.infoLabel}>Wallet Address:</strong>
                                    <span className={styles.infoValue}>
                                        {expanded ? currentUserProfile?.xrplAddress : getShortAddress(currentUserProfile?.xrplAddress)}
                                        {currentUserProfile?.xrplAddress && currentUserProfile?.xrplAddress.length > 12 && (
                                            <button
                                                onClick={() => setExpanded(!expanded)}
                                                className={styles.addressToggleButton}
                                            >
                                                {expanded ? 'Hide' : 'Show full'}
                                            </button>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.editForm}>
                            <div className={styles.formGroup}>
                                <label htmlFor="displayName">Name:</label>
                                <input
                                    type="text"
                                    id="displayName"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button className={styles.saveButton} onClick={handleSave}>
                                    Save
                                </button>
                                <button className={styles.cancelButton} onClick={handleCancel}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Project List */}
                <div className={styles.projectsSection}>
                    <div className={styles.titleContainer}>
                        <h3 className={styles.projectsTitle}>All Projects</h3>
                    </div>
                    {loadingProjects ? (
                        <p>Loading projects...</p>
                    ) : projects.length > 0 ? (
                        <ul className={styles.projectsList}>
                            {projects.map(project => (
                                // <<<<<<<<<<<< WRAP li WITH Link <<<<<<<<<<<<
                                <li key={project.id} className={styles.projectItem}>
                                    <Link to={`/projects/${project.id}`} className={styles.projectLink}>
                                        <div><strong>Name:</strong> {project.name || 'Unnamed Project'}</div>
                                        <div><strong>Description:</strong> {project.description || 'No description available.'}</div>
                                        {/* You can add more project details here if needed */}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No projects found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;