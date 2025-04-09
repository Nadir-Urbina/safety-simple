import { useState, useEffect } from 'react';
import { useOrganization } from '../../contexts/organization-context';
import { UserData } from '../../types';
import { ComboBoxItem } from '../../components/ui/combobox';

export function useOrganizationMembers() {
  const { organization, getOrganizationUsers } = useOrganization();
  const [members, setMembers] = useState<UserData[]>([]);
  const [comboBoxItems, setComboBoxItems] = useState<ComboBoxItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!organization?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const users = await getOrganizationUsers();
        setMembers(users);
        
        // Transform to ComboBox items format
        const items: ComboBoxItem[] = users.map(user => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName}`.trim() || user.email
        }));
        
        setComboBoxItems(items);
      } catch (err) {
        console.error('Error fetching organization members:', err);
        setError('Failed to load organization members');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMembers();
  }, [organization?.id, getOrganizationUsers]);

  return {
    members,
    comboBoxItems,
    isLoading,
    error
  };
} 