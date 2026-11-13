//! Headroom anchor: a tiny NEAR contract that records SHA-256 hashes of Headroom's evidence.
//!
//! - Only the contract account itself can add a hash (NEAR: a call signed with a key on this
//!   account arrives with predecessor == current account).
//! - First write wins: a hash can never be changed or removed by this contract.
//! - Anyone can read it back with a free view call (`get`, `list`, `count`).
//!
//! The transaction that added a hash also stays in NEAR's history for good, so the proof does
//! not depend on this contract's state alone.
use near_sdk::store::{LookupMap, Vector};
use near_sdk::{env, near, require, BorshStorageKey};

#[near(serializers = [borsh])]
#[derive(BorshStorageKey)]
enum Key {
    ByHash,
    Order,
}

/// One stored hash: what it covers, and when NEAR recorded it.
#[near(serializers = [borsh, json])]
#[derive(Clone, Debug, PartialEq)]
pub struct Anchor {
    pub sha256: String,
    /// Short label, e.g. "evidence/MANIFEST.sha256 @ <git commit>".
    pub label: String,
    pub block_height: u64,
    /// Block timestamp in milliseconds since 1970 (UTC).
    pub timestamp_ms: u64,
}

#[near(contract_state)]
pub struct Contract {
    by_hash: LookupMap<String, Anchor>,
    order: Vector<String>,
}

impl Default for Contract {
    fn default() -> Self {
        Self {
            by_hash: LookupMap::new(Key::ByHash),
            order: Vector::new(Key::Order),
        }
    }
}

const MAX_LABEL: usize = 200;

fn is_sha256_hex(s: &str) -> bool {
    s.len() == 64
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

#[near]
impl Contract {
    /// Record a hash. Returns the stored anchor (the first one, if the hash was already there).
    pub fn anchor(&mut self, sha256: String, label: String) -> Anchor {
        require!(
            env::predecessor_account_id() == env::current_account_id(),
            "only the anchor account can add hashes"
        );
        require!(
            is_sha256_hex(&sha256),
            "sha256 must be 64 lowercase hex characters"
        );
        require!(label.len() <= MAX_LABEL, "label is longer than 200 bytes");
        if let Some(existing) = self.by_hash.get(&sha256) {
            return existing.clone();
        }
        let a = Anchor {
            sha256: sha256.clone(),
            label,
            block_height: env::block_height(),
            timestamp_ms: env::block_timestamp_ms(),
        };
        self.by_hash.insert(sha256.clone(), a.clone());
        self.order.push(sha256);
        env::log_str(&format!(
            "EVENT_JSON:{{\"standard\":\"headroom-anchor\",\"version\":\"1.0.0\",\"event\":\"anchor\",\"data\":[{{\"sha256\":\"{}\",\"block_height\":{}}}]}}",
            a.sha256, a.block_height
        ));
        a
    }

    pub fn get(&self, sha256: String) -> Option<Anchor> {
        self.by_hash.get(&sha256).cloned()
    }

    pub fn count(&self) -> u32 {
        self.order.len()
    }

    /// Anchors in the order they were added. `limit` is capped at 100.
    pub fn list(&self, from_index: Option<u32>, limit: Option<u32>) -> Vec<Anchor> {
        let from = from_index.unwrap_or(0);
        let to = from
            .saturating_add(limit.unwrap_or(50).min(100))
            .min(self.order.len());
        (from..to)
            .filter_map(|i| self.order.get(i).and_then(|h| self.by_hash.get(h)).cloned())
            .collect()
    }
}

#[cfg(test)]
mod tests;
