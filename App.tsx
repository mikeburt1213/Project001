import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { aisleForCategory, getStore, STORES } from './src/data/stores';
import {
  loadApiKey,
  loadItems,
  loadStoreId,
  saveApiKey,
  saveItems,
  saveStoreId,
} from './src/services/storage';
import { detectProductsFromPhoto } from './src/services/vision';
import type { DetectedProduct, ShoppingItem } from './src/types';

type AisleSection = {
  title: string;
  subtitle: string;
  data: ShoppingItem[];
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function productsToItems(
  products: DetectedProduct[],
  photoUri: string,
): ShoppingItem[] {
  const now = Date.now();
  return products.map((p, index) => ({
    id: newId() + index,
    name: p.name,
    category: p.category,
    quantity: p.quantity,
    notes: p.notes,
    photoUri,
    checked: false,
    createdAt: now + index,
  }));
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [storeId, setStoreId] = useState(STORES[0].id);
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [storeModal, setStoreModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [manualModal, setManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhotoUri, setManualPhotoUri] = useState<string | undefined>();
  const [settingsKeyDraft, setSettingsKeyDraft] = useState('');

  const store = useMemo(() => getStore(storeId), [storeId]);

  /** In-app list grouped by aisle for the selected store (photos + text together). */
  const sections = useMemo((): AisleSection[] => {
    const active = items.filter((i) => !i.checked);
    const done = items.filter((i) => i.checked);

    const group = (list: ShoppingItem[]) => {
      const map = new Map<string, AisleSection>();
      for (const item of list) {
        const { aisle, section } = aisleForCategory(storeId, item.category);
        const key = `${aisle}::${section}`;
        if (!map.has(key)) {
          map.set(key, {
            title: `Aisle ${aisle}`,
            subtitle: section,
            data: [],
          });
        }
        map.get(key)!.data.push(item);
      }
      for (const sec of map.values()) {
        sec.data.sort((a, b) => a.name.localeCompare(b.name));
      }
      return [...map.values()].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { numeric: true }),
      );
    };

    const openSections = group(active);
    if (done.length === 0) return openSections;

    // Checked items stay in the list under a single "Got it" section
    const checkedSorted = [...done].sort((a, b) => a.name.localeCompare(b.name));
    return [
      ...openSections,
      {
        title: 'Got it',
        subtitle: `${done.length} checked off`,
        data: checkedSorted,
      },
    ];
  }, [items, storeId]);

  const remaining = items.filter((i) => !i.checked).length;

  useEffect(() => {
    (async () => {
      const [loadedItems, loadedStore, loadedKey] = await Promise.all([
        loadItems(),
        loadStoreId(),
        loadApiKey(),
      ]);
      setItems(loadedItems);
      setStoreId(loadedStore);
      setApiKey(loadedKey);
      setSettingsKeyDraft(loadedKey);
      setReady(true);
    })().catch((err) => {
      console.warn(err);
      setReady(true);
    });
  }, []);

  const persistItems = useCallback(async (next: ShoppingItem[]) => {
    setItems(next);
    await saveItems(next);
  }, []);

  const addItems = useCallback(
    async (incoming: ShoppingItem[]) => {
      if (!incoming.length) return;
      await persistItems([...incoming, ...items]);
    },
    [items, persistItems],
  );

  const toggleItem = useCallback(
    async (id: string) => {
      const next = items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      );
      await persistItems(next);
    },
    [items, persistItems],
  );

  const removeItem = useCallback(
    async (id: string) => {
      await persistItems(items.filter((item) => item.id !== id));
    },
    [items, persistItems],
  );

  const clearChecked = useCallback(async () => {
    await persistItems(items.filter((item) => !item.checked));
  }, [items, persistItems]);

  const onSelectStore = useCallback(async (id: string) => {
    setStoreId(id);
    await saveStoreId(id);
    setStoreModal(false);
  }, []);

  const saveSettings = useCallback(async () => {
    setApiKey(settingsKeyDraft.trim());
    await saveApiKey(settingsKeyDraft);
    setSettingsModal(false);
    Alert.alert('Saved', 'API key stored on this device.');
  }, [settingsKeyDraft]);

  const pickImage = useCallback(
    async (source: 'camera' | 'library') => {
      if (source === 'camera') {
        const cam = await ImagePicker.requestCameraPermissionsAsync();
        if (!cam.granted) {
          Alert.alert(
            'Camera permission',
            'Allow camera access to photograph products for your list.',
          );
          return null;
        }
      } else {
        const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!lib.granted) {
          Alert.alert(
            'Photos permission',
            'Allow photo library access to add product pictures.',
          );
          return null;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.7,
              allowsEditing: false,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.7,
              allowsMultipleSelection: true,
              selectionLimit: 8,
            });

      if (result.canceled || !result.assets?.length) return null;
      return result.assets.map((a) => a.uri);
    },
    [],
  );

  const analyzeUris = useCallback(
    async (uris: string[]) => {
      if (!uris.length) return;
      setBusy(true);
      setStatus('Identifying products…');

      const collected: ShoppingItem[] = [];
      const failed: string[] = [];

      try {
        for (let i = 0; i < uris.length; i++) {
          const uri = uris[i];
          setStatus(`Analyzing photo ${i + 1} of ${uris.length}…`);
          try {
            const products = await detectProductsFromPhoto(uri, apiKey);
            if (products.length === 0) {
              failed.push(uri);
            } else {
              collected.push(...productsToItems(products, uri));
            }
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Unknown vision error';
            // If key missing / API fails, fall back to manual entry for first photo
            if (i === 0 && uris.length === 1) {
              setBusy(false);
              setStatus(null);
              setManualPhotoUri(uri);
              setManualName('');
              setManualModal(true);
              Alert.alert(
                'Could not auto-identify',
                `${message}\n\nEnter the item name manually — the photo will stay on the list.`,
              );
              return;
            }
            failed.push(uri);
          }
        }

        if (collected.length) {
          await addItems(collected);
        }

        if (failed.length && collected.length) {
          Alert.alert(
            'Partially done',
            `Added ${collected.length} item(s). ${failed.length} photo(s) could not be identified.`,
          );
        } else if (failed.length && !collected.length) {
          setManualPhotoUri(failed[0]);
          setManualName('');
          setManualModal(true);
          Alert.alert(
            'No products found',
            'Enter a name manually. The photo will still be attached for location help.',
          );
        } else if (collected.length) {
          setStatus(`Added ${collected.length} item(s)`);
          setTimeout(() => setStatus(null), 2000);
        }
      } finally {
        setBusy(false);
        if (!manualModal) {
          // status cleared above when success
        }
      }
    },
    [addItems, apiKey, manualModal],
  );

  const onCapture = useCallback(async () => {
    const uris = await pickImage('camera');
    if (uris) await analyzeUris(uris);
  }, [analyzeUris, pickImage]);

  const onPickLibrary = useCallback(async () => {
    const uris = await pickImage('library');
    if (uris) await analyzeUris(uris);
  }, [analyzeUris, pickImage]);

  const onManualSave = useCallback(async () => {
    const name = manualName.trim();
    if (!name) {
      Alert.alert('Name required', 'Enter what this item is called.');
      return;
    }
    const item: ShoppingItem = {
      id: newId(),
      name,
      category: 'other',
      quantity: 1,
      photoUri: manualPhotoUri,
      checked: false,
      createdAt: Date.now(),
    };
    await addItems([item]);
    setManualModal(false);
    setManualName('');
    setManualPhotoUri(undefined);
    setStatus(null);
  }, [addItems, manualName, manualPhotoUri]);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color="#38BDF8" size="large" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.appTitle}>ShopSnap List</Text>
          <Text style={styles.appSub}>
            {remaining} left · {items.length} total
          </Text>
        </View>
        <Pressable
          style={styles.chip}
          onPress={() => setSettingsModal(true)}
          accessibilityRole="button"
        >
          <Text style={styles.chipText}>Settings</Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.storeCard}
        onPress={() => setStoreModal(true)}
        accessibilityRole="button"
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.storeLabel}>Shopping at</Text>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeBlurb}>{store.blurb}</Text>
        </View>
        <Text style={styles.storeChange}>Change</Text>
      </Pressable>

      {status ? (
        <View style={styles.statusBar}>
          {busy ? <ActivityIndicator color="#0B1220" /> : null}
          <Text style={styles.statusText}>{status}</Text>
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled
        contentContainerStyle={
          items.length === 0 ? styles.emptyList : styles.listContent
        }
        ListHeaderComponent={
          items.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderTitle}>Your shopping list</Text>
              <Text style={styles.listHeaderSub}>
                Sorted by aisle at {store.name}. Tap to check off; long-press to
                remove. Photos help you match the item on the shelf.
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your list is empty</Text>
            <Text style={styles.emptyBody}>
              Take a photo of one or more products. We&apos;ll add them here
              with pictures and aisle locations for {store.name} — all in the
              app, no file export needed.
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionSub}>{section.subtitle}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, item.checked && styles.rowChecked]}
            onPress={() => toggleItem(item.id)}
            onLongPress={() =>
              Alert.alert(item.name, 'Remove this item?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => removeItem(item.id),
                },
              ])
            }
          >
            <View style={styles.checkBox}>
              <Text style={styles.checkMark}>{item.checked ? '✓' : ''}</Text>
            </View>
            {item.photoUri ? (
              <Image
                source={{ uri: item.photoUri }}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={styles.thumbPlaceholderText}>?</Text>
              </View>
            )}
            <View style={styles.rowBody}>
              <Text
                style={[styles.itemName, item.checked && styles.itemNameDone]}
                numberOfLines={2}
              >
                {item.name}
                {item.quantity > 1 ? ` ×${item.quantity}` : ''}
              </Text>
              {item.notes ? (
                <Text style={styles.notesText} numberOfLines={2}>
                  {item.notes}
                </Text>
              ) : null}
            </View>
          </Pressable>
        )}
      />

      <View style={styles.footer}>
        <Pressable
          style={[styles.btn, styles.btnSecondary]}
          onPress={onPickLibrary}
          disabled={busy}
        >
          <Text style={styles.btnSecondaryText}>Photos</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={onCapture}
          disabled={busy}
        >
          <Text style={styles.btnPrimaryText}>
            {busy ? 'Working…' : 'Take photo'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => {
            setManualPhotoUri(undefined);
            setManualName('');
            setManualModal(true);
          }}
          disabled={busy}
        >
          <Text style={styles.btnSecondaryText}>Add text</Text>
        </Pressable>
      </View>

      <View style={styles.footerHint}>
        {items.some((i) => i.checked) ? (
          <Pressable onPress={clearChecked}>
            <Text style={styles.link}>Clear checked items</Text>
          </Pressable>
        ) : (
          <Text style={styles.footerHintText}>
            List lives in the app · photos + aisle by store
          </Text>
        )}
      </View>

      {/* Store picker */}
      <Modal
        visible={storeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setStoreModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              Keyboard.dismiss();
              setStoreModal(false);
            }}
          />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select store</Text>
            <Text style={styles.modalSub}>
              Aisle numbers are typical layouts and may vary by location.
            </Text>
            <ScrollView
              style={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {STORES.map((s) => (
                <Pressable
                  key={s.id}
                  style={[
                    styles.storeOption,
                    s.id === storeId && styles.storeOptionActive,
                  ]}
                  onPress={() => onSelectStore(s.id)}
                >
                  <Text style={styles.storeOptionName}>{s.name}</Text>
                  <Text style={styles.storeOptionBlurb}>{s.blurb}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              style={styles.modalClose}
              onPress={() => setStoreModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settings */}
      <Modal
        visible={settingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              Keyboard.dismiss();
              setSettingsModal(false);
            }}
          />
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalTitle}>Settings</Text>
              <Text style={styles.modalSub}>
                SpaceXAI (xAI) key powers photo → product recognition. Get a key
                at console.x.ai. Stored only on this device.
              </Text>
              <Text style={styles.inputLabel}>XAI_API_KEY</Text>
              <TextInput
                style={styles.input}
                value={settingsKeyDraft}
                onChangeText={setSettingsKeyDraft}
                placeholder="xai-..."
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                blurOnSubmit
              />
              <Pressable
                style={[styles.btn, styles.btnPrimary, styles.modalActionBtn]}
                onPress={() => {
                  Keyboard.dismiss();
                  void saveSettings();
                }}
              >
                <Text style={styles.btnPrimaryText}>Save</Text>
              </Pressable>
              <Pressable
                style={styles.modalClose}
                onPress={() => {
                  Keyboard.dismiss();
                  setSettingsModal(false);
                }}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Manual item */}
      <Modal
        visible={manualModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setManualModal(false);
          setStatus(null);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => {
              Keyboard.dismiss();
              setManualModal(false);
              setStatus(null);
            }}
          />
          <View style={styles.modalCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalTitle}>Add item</Text>
              {manualPhotoUri ? (
                <Image
                  source={{ uri: manualPhotoUri }}
                  style={styles.manualPreview}
                  contentFit="cover"
                />
              ) : null}
              <Text style={styles.inputLabel}>Item name</Text>
              <TextInput
                style={styles.input}
                value={manualName}
                onChangeText={setManualName}
                placeholder="e.g. Organic bananas"
                placeholderTextColor="#64748B"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  Keyboard.dismiss();
                  void onManualSave();
                }}
                blurOnSubmit
              />
              <Pressable
                style={[styles.btn, styles.btnPrimary, styles.modalActionBtn]}
                onPress={() => {
                  Keyboard.dismiss();
                  void onManualSave();
                }}
              >
                <Text style={styles.btnPrimaryText}>Add to list</Text>
              </Pressable>
              <Pressable
                style={styles.modalClose}
                onPress={() => {
                  Keyboard.dismiss();
                  setManualModal(false);
                  setStatus(null);
                }}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safe: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  appTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
  },
  appSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  chip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  storeCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1F2937',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeLabel: {
    color: '#64748B',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  storeName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  storeBlurb: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  storeChange: {
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 14,
  },
  statusBar: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#38BDF8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    color: '#0B1220',
    fontWeight: '600',
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listHeader: {
    marginBottom: 12,
    gap: 4,
  },
  listHeaderTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  listHeaderSub: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeader: {
    backgroundColor: '#0B1220',
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#38BDF8',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  empty: {
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyBody: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1F2937',
    gap: 10,
    marginBottom: 8,
  },
  rowChecked: {
    opacity: 0.55,
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#38BDF8',
    fontWeight: '800',
    fontSize: 14,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#1E293B',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  itemNameDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  aisleText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  notesText: {
    color: '#64748B',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  footerHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 14,
  },
  footerHintText: {
    color: '#64748B',
    fontSize: 12,
  },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: {
    backgroundColor: '#38BDF8',
    flex: 1.4,
  },
  btnPrimaryText: {
    color: '#0B1220',
    fontWeight: '800',
    fontSize: 15,
  },
  btnSecondary: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnSecondaryText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 13,
  },
  link: {
    color: '#94A3B8',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    maxHeight: '92%',
  },
  modalScroll: {
    maxHeight: 420,
  },
  modalScrollContent: {
    gap: 12,
    paddingBottom: 8,
  },
  modalActionBtn: {
    marginTop: 4,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSub: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  storeOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#111827',
    marginBottom: 8,
  },
  storeOptionActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0C4A6E33',
  },
  storeOptionName: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 16,
  },
  storeOptionBlurb: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  modalClose: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalCloseText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F8FAFC',
    fontSize: 15,
  },
  manualPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
});
